import os, json, asyncio
from typing import Dict, Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query 
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from ib_insync import IB, Stock, Forex, Future, Option, Contract, MarketOrder, LimitOrder, StopOrder, StopLimitOrder, util
from dotenv import load_dotenv
import math 
from ibkr_client import IBKRClient
load_dotenv()

IB_HOST = os.getenv("IB_HOST", "127.0.0.1")
IB_PORT = int(os.getenv("IB_PORT", "4002"))
IB_CLIENT_ID = int(os.getenv("IB_CLIENT_ID", "17"))
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]

app = FastAPI(title="IBKR Trading Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ib = IB()
_connected = False
_conn_lock = asyncio.Lock()

def _connect_blocking():
    if not ib.isConnected():
        ib.connect(IB_HOST, IB_PORT, clientId=IB_CLIENT_ID)

# main.py

async def ensure_connected():
    global _connected

    if _connected and ib.isConnected():
        print("[🧠 ensure_connected] Already connected ✅")
        return

    async with _conn_lock:
        if _connected and ib.isConnected():
            print("[🔒 ensure_connected] Already connected inside lock ✅")
            return

        try:
            print(f"[🔌 ensure_connected] Trying async connect to {IB_HOST}:{IB_PORT}")
            await ib.connectAsync(IB_HOST, IB_PORT, clientId=IB_CLIENT_ID)
            if not ib.isConnected():
                raise RuntimeError("Async connect failed, fallback to sync.")

            _connected = True
            print("[✅ ensure_connected] Async connect succeeded")

        except Exception as e:
            print(f"[⚠️ ensure_connected] Async connect failed: {e}")
            try:
                print("[🔁 ensure_connected] Retrying with blocking connect...")
                _connect_blocking()
                if ib.isConnected():
                    _connected = True
                    print("[✅ ensure_connected] Blocking connect succeeded")
                else:
                    raise RuntimeError("Blocking connect also failed.")
            except Exception as e2:
                print(f"[❌ ensure_connected] FATAL: All connection attempts failed: {e2}")
                raise HTTPException(status_code=500, detail="IBKR connection failed")


class ContractReq(BaseModel):
    symbol: str
    secType: str = "STK"
    exchange: str = "SMART"
    currency: str = "USD"

class OrderReq(BaseModel):
    contract: ContractReq
    action: str = Field(..., pattern="^(BUY|SELL|buy|sell)$")

    quantity: int = Field(..., gt=0)
    orderType: str = Field("MKT", pattern="^(MKT|LMT|STP|STP LMT)$")
    lmtPrice: Optional[float] = None
    auxPrice: Optional[float] = None

class CancelReq(BaseModel):
    orderId: int

def build_contract(req: ContractReq) -> Contract:
    st = req.secType.upper()
    if st == "STK": return Stock(req.symbol, req.exchange, req.currency)
    if st == "FX":  return Forex(req.symbol)
    if st == "FUT": return Future(req.symbol, exchange=req.exchange, currency=req.currency)
    if st == "OPT": return Option(req.symbol, exchange=req.exchange, currency=req.currency)
    raise HTTPException(400, f"Unsupported secType: {st}")

def build_order(req: OrderReq):
    typ = req.orderType.upper(); action = req.action.upper()
    if typ == "MKT": return MarketOrder(action, req.quantity)
    if typ == "LMT":
        if req.lmtPrice is None: raise HTTPException(400, "lmtPrice required for LMT")
        return LimitOrder(action, req.quantity, req.lmtPrice)
    if typ == "STP":
        if req.auxPrice is None: raise HTTPException(400, "auxPrice required for STP")
        return StopOrder(action, req.quantity, req.auxPrice)
    if typ == "STP LMT":
        if req.auxPrice is None or req.lmtPrice is None: raise HTTPException(400, "auxPrice and lmtPrice required for STP LMT")
        return StopLimitOrder(action, req.quantity, req.lmtPrice, req.auxPrice)
    raise HTTPException(400, f"Unsupported orderType: {typ}")


@app.on_event("startup")
async def startup_event():
    try:
        if not ib.isConnected():
            await ib.connectAsync("127.0.0.1", 4002, clientId=17)
            print("[main_102] IBKR connected")
    except Exception as e:
        print(f"[main_104] Failed to connect to IBKR: {e}")

@app.get("/api/search")
async def search_symbols(q: str = Query(..., min_length=1)) -> dict:
    """
    Return full rows for dropdown:
      { symbol, name, secType, exchange }
    Uses IB's async API directly (no thread hop), then filters & sorts.
    """
    await ensure_connected()
    try:
        q_up = q.upper().strip()
        print(f"[api/search] Incoming query: {q_up}")

        # ✅ Use the true async call (more reliable than thread hop)
        matches = await ib.reqMatchingSymbolsAsync(q_up)
        print(f"[api/search] Raw match count: {len(matches)}")

        rows = []
        seen = set()

        for i, m in enumerate(matches):
            c = m.contract
            sym = (c.symbol or "").upper().strip()
            sec = (c.secType or "").upper().strip()
            exch = (c.primaryExchange or c.exchange or "SMART").upper().strip()
            #✅ FIX IBKR provides a human-friendly description (often the company name) 
            desc = (getattr(m.contract, "description", "") or "").strip()  

            # Debug (keep while validating)
            print(f"[api/search][{i}] sym={sym} sec={sec} exch={exch} desc={desc}")

            # Keep only stocks (skip BOND/IND/OPT/FUT etc)
            if not sym or sec != "STK" or sym in seen:
                continue

            # Some descriptions include suffixes like " - NASDAQ"
            # Keep the left-most piece as a simple name fallback.
            name = desc.split(" - ")[0].strip() or sym

            rows.append({
                "symbol": sym,
                "name": name,
                "secType": sec,
                "exchange": exch or "SMART",
            })
            seen.add(sym)

        # If nothing came back, try a direct qualify fallback for exact ticker input.
        if not rows and q_up.isalpha() and 1 <= len(q_up) <= 5:
            try:
                cand = Stock(q_up, "SMART", "USD")
                await ib.qualifyContractsAsync(cand)
                if cand.conId:
                    rows.append({
                        "symbol": q_up,
                        "name": q_up,            # no name available in this fallback
                        "secType": "STK",
                        "exchange": (cand.primaryExchange or cand.exchange or "SMART").upper(),
                    })
                    print(f"[api/search] Qualify fallback added {q_up}")
            except Exception as e:
                print(f"[api/search] Qualify fallback failed: {e}")

        rows.sort(key=lambda x: x["symbol"])
        print(f"[api/search] Returning {len(rows)} rows")
        return {"results": rows[:20]}

    except Exception as e:
        print(f"[api/search] ERROR: {e}")
        return {"results": []}

@app.post("/api/contract/qualify")
async def qualify(req: ContractReq):
  await ensure_connected()
  c = build_contract(req)
  await asyncio.get_event_loop().run_in_executor(None, ib.qualifyContracts, c)
  return {"conId": c.conId, "symbol": c.symbol, "secType": c.secType, "exchange": c.exchange, "currency": c.currency}

@app.post("/api/quote/snapshot")
async def quote_snapshot(req: ContractReq):
  await ensure_connected()
  c = build_contract(req)
  await asyncio.get_event_loop().run_in_executor(None, ib.qualifyContracts, c)
  t = ib.reqMktData(c, "", False, False)
  await asyncio.sleep(0.5)
  out = {
    "symbol": req.symbol,
    "last": float(t.last or t.close or 0),
    "bid": float(t.bid or 0),
    "ask": float(t.ask or 0),
    "volume": int(t.volume or 0),
    "time": util.datetimeToFloat(t.time) if t.time else None,
  }
  ib.cancelMktData(t.contract)
  return out

@app.post("/api/order/place")
async def order_place(req: OrderReq):
  await ensure_connected()
  c = build_contract(req.contract)
  await asyncio.get_event_loop().run_in_executor(None, ib.qualifyContracts, c)
  order = build_order(req)
  trade = ib.placeOrder(c, order)
  await asyncio.sleep(0.1)
  return {
    "orderId": trade.order.orderId,
    "status": trade.orderStatus.status,
    "filled": trade.orderStatus.filled,
    "remaining": trade.orderStatus.remaining,
    "avgFillPrice": trade.orderStatus.avgFillPrice,
  }

@app.post("/api/order/cancel")
async def order_cancel(r: CancelReq):
  await ensure_connected()
  target = next((o for o in ib.orders() if o.orderId == r.orderId), None)
  if not target: raise HTTPException(404, f"Order {r.orderId} not found")
  ib.cancelOrder(target)
  return {"ok": True}

@app.get("/api/orders/open")
async def orders_open():
  await ensure_connected()
  return [
    {
      "orderId": t.order.orderId,
      "symbol": t.contract.symbol,
      "status": t.orderStatus.status,
      "filled": t.orderStatus.filled,
      "remaining": t.orderStatus.remaining,
      "avgFillPrice": t.orderStatus.avgFillPrice,
    }
    for t in ib.openTrades()
  ]

@app.get("/api/positions")
async def positions():
  await ensure_connected()
  pos = ib.positions()
  return [
    {
      "account": p.account,
      "symbol": p.contract.symbol,
      "conId": p.contract.conId,
      "position": p.position,
      "avgCost": p.avgCost,
    }
    for p in pos
  ]

@app.get("/api/account/summary")
async def account_summary():
  await ensure_connected()
  summ = ib.accountSummary()
  return [{"tag": s.tag, "value": s.value, "currency": s.currency, "account": s.account} for s in summ]
@app.websocket("/ws/stream")


@app.websocket("/ws/stream")
async def ws_stream(ws: WebSocket):
    await ws.accept()
    await ensure_connected()
    tickers: Dict[str, any] = {}

    try:
        print("[🔌] WebSocket client connected.")

        while True:
            try:
                raw = await asyncio.wait_for(ws.receive_text(), timeout=0.05)
            except asyncio.TimeoutError:
                raw = None

            if raw:
                try:
                    msg = json.loads(raw)
                    op = msg.get("op")
                    sym = msg.get("symbol")

                    if op == "subscribe" and sym:
                      print(f"[🛰️] Subscribing to {sym}")
                      # c = Stock(sym, "SMART", "USD") # BEFORE 
                      if "." in sym:  # crude way to detect FX
                          base, quote = sym.split(".")
                          c = Forex(base + quote)  # e.g., EURUSD
                      else:
                          c = Stock(sym, "SMART", "USD", primaryExchange="NASDAQ")


                      # ✅ Async contract qualification (Python 3.12 safe)
                      await ib.qualifyContractsAsync(c)
                      
                      print(f"[🔎] Qualified contract for {sym}: {c}")
                      print(f"[✅] Qualified {sym}: conId={c.conId}")

                      t = ib.reqMktData(c, "", False, False)
                      tickers[sym] = t

                    elif op == "unsubscribe" and sym:
                        t = tickers.pop(sym, None)
                        if t:
                            ib.cancelMktData(t.contract)
                            print(f"[⛔] Unsubscribed {sym}")

                except Exception as e:
                    print(f"[❌] Error handling message: {e}")

            if tickers:
                payload = []
                for sym, t in list(tickers.items()):
                    tick_data = {
                      "symbol": sym,
                      "last": (
                          float(t.last or t.close or 0)
                          if (t.last or t.close) and not math.isnan(t.last or t.close or 0)
                          else None
                      ),
                      "bid": (
                          float(t.bid or 0) if t.bid is not None and not math.isnan(t.bid) else None
                      ),
                      "ask": (
                          float(t.ask or 0) if t.ask is not None and not math.isnan(t.ask) else None
                      ),
                      "volume": (
                          int(t.volume) if t.volume is not None and not math.isnan(t.volume) else 0
                      ),
                      "time": util.datetimeToFloat(t.time) if t.time else None
                  }


                    payload.append(tick_data)

                await ws.send_text(json.dumps({"type": "tick", "data": payload}))
                # AAAAAAAAAA
                # print(f"[📡] Sent {len(payload)} ticks")
                # print(f"[🧪] {sym}: last={t.last}, bid={t.bid}, ask={t.ask}, volume={t.volume}, time={t.time}")


            await asyncio.sleep(0.25)

    except WebSocketDisconnect:
        print("[🔌] WebSocket client disconnected.")
    except Exception as e:
        print(f"[🔥] WebSocket fatal error: {e}")
    finally:
        for t in tickers.values():
            ib.cancelMktData(t.contract)
        print("[🧹] Cleaned up tickers.")


@app.websocket("/ws/orders")
async def ws_orders(ws: WebSocket):
  await ws.accept()
  await ensure_connected()
  async def forward(trade):
    msg = { "orderId": trade.order.orderId, "symbol": getattr(trade.contract, "symbol", None),
      "status": trade.orderStatus.status, "filled": trade.orderStatus.filled,
      "remaining": trade.orderStatus.remaining, "avgFillPrice": trade.orderStatus.avgFillPrice,
      "permId": trade.order.permId }
    try: await ws.send_text(json.dumps(msg))
    except Exception: pass
  def _on_trade(trade): asyncio.create_task(forward(trade))
  ib.tradesEvent += _on_trade
  try:
    while True: await asyncio.sleep(1.0)
  except WebSocketDisconnect:
    pass
  finally:
    ib.tradesEvent -= _on_trade

from datetime import datetime

class HistoryReq(BaseModel):
    symbol: str
    durationStr: str = "1 D"
    barSize: str = "5 mins"
    whatToShow: str = "TRADES"  # or "MIDPOINT" for FX
    useRTH: bool = False
    endDateTime: Optional[str] = ""  # '' means now

@app.post("/api/history")
async def get_history(req: HistoryReq):
    await ensure_connected()

    # Detect FX via dot notation and route accordingly
    if "." in req.symbol:
        base, quote = req.symbol.split(".")
        contract = Forex(base + quote)
        whatToShow = "MIDPOINT"
    else:
        contract = Stock(req.symbol, "SMART", "USD", primaryExchange="NASDAQ")
        whatToShow = req.whatToShow or "TRADES"

    await ib.qualifyContractsAsync(contract)

    bars = await ib.reqHistoricalDataAsync(
        contract,
        endDateTime=req.endDateTime or "",
        durationStr=req.durationStr,
        barSizeSetting=req.barSize,
        whatToShow=whatToShow,
        useRTH=req.useRTH,
        formatDate=1
    )

    return {
        "symbol": req.symbol,
        "barCount": len(bars),
        "bars": [
            {
                "time": b.date.isoformat() if isinstance(b.date, datetime) else str(b.date),
                "open": float(b.open),
                "high": float(b.high),
                "low": float(b.low),
                "close": float(b.close),
                "volume": int(b.volume or 0)
            } for b in bars
        ]
    }
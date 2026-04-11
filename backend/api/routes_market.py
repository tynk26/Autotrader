from fastapi import APIRouter, Query
import asyncio
import math
from datetime import datetime

from core.ibkr import ensure_connected, ib
from ib_insync import Stock, Forex, util
from schemas.trade import HistoryReq

router = APIRouter()


# ---------------- SEARCH ----------------
@router.get("/api/search")
async def search(q: str = Query(..., min_length=1)):
    await ensure_connected()

    matches = await ib.reqMatchingSymbolsAsync(q.upper())

    seen = set()
    out = []

    for m in matches:
        c = m.contract

        if c.secType != "STK":
            continue

        if c.symbol in seen:
            continue

        seen.add(c.symbol)

        out.append({
            "symbol": c.symbol,
            "name": getattr(c, "description", c.symbol),
            "secType": c.secType,
            "exchange": c.exchange
        })

    return {"results": out}


# ---------------- HISTORY ----------------
@router.post("/api/history")
async def history(req: HistoryReq):
    await ensure_connected()

    if "." in req.symbol:
        base, quote = req.symbol.split(".")
        contract = Forex(base + quote)
        whatToShow = "MIDPOINT"
    else:
        contract = Stock(req.symbol, "SMART", "USD", primaryExchange="NASDAQ")
        whatToShow = req.whatToShow

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
                "open": b.open,
                "high": b.high,
                "low": b.low,
                "close": b.close,
                "volume": b.volume
            }
            for b in bars
        ]
    }


# ---------------- SNAPSHOT ----------------
@router.post("/api/quote/snapshot")
async def snapshot(req: HistoryReq):
    await ensure_connected()

    c = Stock(req.symbol, "SMART", "USD")
    await ib.qualifyContractsAsync(c)

    t = ib.reqMktData(c, "", False, False)
    await asyncio.sleep(0.5)

    out = {
        "symbol": req.symbol,
        "last": float(t.last or 0),
        "bid": float(t.bid or 0),
        "ask": float(t.ask or 0),
        "volume": int(t.volume or 0),
        "time": util.time.time()
    }

    ib.cancelMktData(c)
    return out
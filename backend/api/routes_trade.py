from fastapi import APIRouter, HTTPException
import asyncio

from core.ibkr import ensure_connected, ib
from schemas.trade import OrderReq, CancelReq
from services.ibkr_service import build_contract, build_order

router = APIRouter()


@router.post("/api/order/place")
async def place_order(req: OrderReq):
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


@router.post("/api/order/cancel")
async def cancel_order(req: CancelReq):
    await ensure_connected()

    target = next((o for o in ib.orders() if o.orderId == req.orderId), None)

    if not target:
        raise HTTPException(404, "Order not found")

    ib.cancelOrder(target)
    return {"ok": True}


@router.get("/api/orders/open")
async def open_orders():
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


@router.get("/api/positions")
async def positions():
    await ensure_connected()

    return [
        {
            "account": p.account,
            "symbol": p.contract.symbol,
            "conId": p.contract.conId,
            "position": p.position,
            "avgCost": p.avgCost,
        }
        for p in ib.positions()
    ]
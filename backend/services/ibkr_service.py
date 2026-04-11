from ib_insync import Stock, Forex, Future, Option, MarketOrder, LimitOrder, StopOrder, StopLimitOrder, Contract
from fastapi import HTTPException
from core.ibkr import ib


def build_contract(req):
    st = req.secType.upper()

    if st == "STK":
        return Stock(req.symbol, req.exchange, req.currency)
    if st == "FX":
        return Forex(req.symbol)
    if st == "FUT":
        return Future(req.symbol, exchange=req.exchange, currency=req.currency)
    if st == "OPT":
        return Option(req.symbol, exchange=req.exchange, currency=req.currency)

    raise HTTPException(400, "Unsupported secType")


def build_order(req):
    typ = req.orderType.upper()
    action = req.action.upper()

    if typ == "MKT":
        return MarketOrder(action, req.quantity)

    if typ == "LMT":
        if req.lmtPrice is None:
            raise HTTPException(400, "lmtPrice required")
        return LimitOrder(action, req.quantity, req.lmtPrice)

    if typ == "STP":
        if req.auxPrice is None:
            raise HTTPException(400, "auxPrice required")
        return StopOrder(action, req.quantity, req.auxPrice)

    if typ == "STP LMT":
        if req.lmtPrice is None or req.auxPrice is None:
            raise HTTPException(400, "missing prices")
        return StopLimitOrder(action, req.quantity, req.lmtPrice, req.auxPrice)

    raise HTTPException(400, "bad order type")
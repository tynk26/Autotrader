from fastapi import APIRouter
from core.ibkr import ensure_connected, ib

router = APIRouter()


@router.get("/api/account/summary")
async def account_summary():
    await ensure_connected()

    return [
        {
            "tag": s.tag,
            "value": s.value,
            "currency": s.currency,
            "account": s.account
        }
        for s in ib.accountSummary()
    ]
from pydantic import BaseModel, Field
from typing import Optional


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


class HistoryReq(BaseModel):
    symbol: str
    durationStr: str = "1 D"
    barSize: str = "5 mins"
    whatToShow: str = "TRADES"
    useRTH: bool = False
    endDateTime: Optional[str] = ""
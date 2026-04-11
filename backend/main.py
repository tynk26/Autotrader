from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.database import engine, Base

from api.routes_trade import router as trade_router
from api.routes_market import router as market_router
from api.routes_account import router as account_router
from ws.test import router as ws_test_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(trade_router)
app.include_router(market_router)
app.include_router(account_router)
app.include_router(ws_test_router)


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("[DB] ready")


@app.get("/")
def root():
    return {"status": "ok"}
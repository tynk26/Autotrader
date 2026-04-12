# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio

# ------------------------------
# DATABASE
# ------------------------------
from db.database import engine, Base

# ------------------------------
# API ROUTERS
# ------------------------------
from api.routes_trade import router as trade_router
from api.routes_market import router as market_router
from api.routes_account import router as account_router

# ------------------------------
# WEBSOCKET ROUTERS
# ------------------------------
from ws.test import router as ws_test_router
from ws.indicators import (
    router as ws_indicator_router,
    broadcast_indicator,
)

# ------------------------------
# STRATEGY ENGINE
# ------------------------------
from strategy_engine import StrategyEngine


# =====================================================
# FASTAPI APP INIT
# =====================================================
app = FastAPI(
    title="ALGO_V4 Strategy Backend",
    description="Real-time MTF Fractal VWAP + MACD + Fibonacci Trading Engine",
    version="4.0.0"
)


# =====================================================
# GLOBAL STRATEGY ENGINE SINGLETON
# =====================================================
strategy_engine = StrategyEngine()


# =====================================================
# CORS CONFIG
# =====================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# REGISTER REST ROUTERS
# =====================================================
app.include_router(trade_router)
app.include_router(market_router)
app.include_router(account_router)


# =====================================================
# REGISTER WS ROUTERS
# =====================================================
app.include_router(ws_test_router)
app.include_router(ws_indicator_router)


# =====================================================
# BACKGROUND STRATEGY LOOP
# =====================================================
async def strategy_loop():
    """
    Periodically computes indicator outputs
    and broadcasts them to all ws clients.
    """
    print("[main.py] Strategy loop started")

    while True:
        try:
            for tf in ["1m", "5m", "15m", "1h"]:
                result = strategy_engine.compute(tf)

                if result:
                    print(
                        f"[main.py_strategy_loop] broadcasting {tf} | "
                        f"VWAP={result['anchor_vwap']} | "
                        f"Trend={result['trend']}"
                    )

                    await broadcast_indicator(result)

            await asyncio.sleep(1)

        except Exception as e:
            print(f"[main.py_strategy_loop ERROR] {e}")
            await asyncio.sleep(1)


# =====================================================
# STARTUP EVENT
# =====================================================
@app.on_event("startup")
async def startup():
    print("[main.py] Startup initializing...")

    max_retries = 20
    retry_delay = 2

    for attempt in range(max_retries):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

            print("[DB] ready")
            break

        except Exception as e:
            print(
                f"[DB Retry {attempt+1}/{max_retries}] waiting for postgres... {e}"
            )
            await asyncio.sleep(retry_delay)

    else:
        raise RuntimeError("Database failed to become ready.")

    asyncio.create_task(strategy_loop())

    print("[Strategy Engine] started")


# =====================================================
# SHUTDOWN EVENT
# =====================================================
@app.on_event("shutdown")
async def shutdown():
    print("[main.py] Shutdown complete")


# =====================================================
# ROOT HEALTH CHECK
# =====================================================
@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "ALGO_V4 backend running",
        "engine": "MTF Fractal VWAP + MACD + Fibonacci active"
    }
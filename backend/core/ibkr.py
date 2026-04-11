import asyncio
from ib_insync import IB
from fastapi import HTTPException
from core.config import IB_HOST, IB_PORT, IB_CLIENT_ID

ib = IB()

_connected = False
_conn_lock = asyncio.Lock()


def _connect_blocking():
    if not ib.isConnected():
        ib.connect(IB_HOST, IB_PORT, clientId=IB_CLIENT_ID)


async def ensure_connected():
    global _connected

    if _connected and ib.isConnected():
        return

    async with _conn_lock:
        if _connected and ib.isConnected():
            return

        try:
            await ib.connectAsync(IB_HOST, IB_PORT, clientId=IB_CLIENT_ID)

            if not ib.isConnected():
                raise RuntimeError("Async connect failed")

            _connected = True
            print("[IBKR] async connected")

        except Exception as e:
            print("[IBKR] async failed:", e)

            try:
                _connect_blocking()

                if not ib.isConnected():
                    raise RuntimeError("blocking failed")

                _connected = True
                print("[IBKR] blocking connected")

            except Exception as e2:
                raise HTTPException(status_code=500, detail=f"IBKR failed: {e2}")
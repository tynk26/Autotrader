# backend/ws/indicators.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ws.manager import ConnectionManager

router = APIRouter()

manager = ConnectionManager()


@router.websocket("/ws/indicators")
async def websocket_indicators(ws: WebSocket):
    await manager.connect(ws)

    print("[indicators.py] client connected")

    try:
        while True:
            await ws.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(ws)
        print("[indicators.py] client disconnected")


async def broadcast_indicator(data: dict):
    await manager.broadcast(data)
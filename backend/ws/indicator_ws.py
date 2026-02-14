# backend/ws/indicator_ws.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from .manager import ConnectionManager

router = APIRouter()
manager = ConnectionManager()


@router.websocket("/ws/indicators")
async def websocket_indicators(ws: WebSocket):
    await manager.connect(ws)

    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
        print("[indicator_ws.py] indicator 연결 종료")


async def broadcast_indicator(data: dict):
    await manager.broadcast(data)

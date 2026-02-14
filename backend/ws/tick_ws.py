# backend/ws/tick_ws.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from .manager import ConnectionManager

router = APIRouter()
manager = ConnectionManager()


@router.websocket("/ws/ticks")
async def websocket_ticks(ws: WebSocket):
    await manager.connect(ws)

    try:
        while True:
            await ws.receive_text()  # keep alive
    except WebSocketDisconnect:
        manager.disconnect(ws)
        print("[tick_ws.py] tick 연결 종료")


# 외부에서 호출할 broadcast 함수
async def broadcast_tick(data: dict):
    await manager.broadcast(data)

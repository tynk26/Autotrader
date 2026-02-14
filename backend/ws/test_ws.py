# backend/ws/test_ws.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from datetime import datetime
from .manager import ConnectionManager

router = APIRouter()
manager = ConnectionManager()


@router.websocket("/ws/test")
async def websocket_test(ws: WebSocket):
    await manager.connect(ws)

    try:
        while True:
            payload = {
                "type": "heartbeat",
                "server_time": datetime.utcnow().isoformat(),
                "message": "WebSocket 정상 동작 중"
            }

            await manager.send_personal(payload, ws)
            print(f"[test_ws.py] 전송: {payload}")

            await asyncio.sleep(1)

    except WebSocketDisconnect:
        manager.disconnect(ws)
        print("[test_ws.py] 연결 종료")

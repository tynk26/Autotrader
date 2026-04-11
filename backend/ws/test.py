from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from datetime import datetime

router = APIRouter()


@router.websocket("/ws/test")
async def test_ws(ws: WebSocket):
    await ws.accept()

    try:
        while True:
            payload = {
                "type": "heartbeat",
                "time": datetime.utcnow().isoformat()
            }

            await ws.send_text(json.dumps(payload))
    except WebSocketDisconnect:
        pass
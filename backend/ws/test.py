from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import asyncio
from datetime import datetime

router = APIRouter()


@router.websocket("/ws/stream")
async def stream_ws(ws: WebSocket):
    await ws.accept()

    print("[ws/test.py] /ws/stream connected")

    try:
        while True:
            payload = {
                "type": "heartbeat",
                "time": datetime.utcnow().isoformat()
            }

            await ws.send_text(json.dumps(payload))
            await asyncio.sleep(1)

    except WebSocketDisconnect:
        print("[ws/test.py] /ws/stream disconnected")


@router.websocket("/ws/test")
async def test_ws(ws: WebSocket):
    await ws.accept()

    print("[ws/test.py] /ws/test connected")

    try:
        while True:
            payload = {
                "type": "heartbeat",
                "time": datetime.utcnow().isoformat()
            }

            await ws.send_text(json.dumps(payload))
            await asyncio.sleep(1)

    except WebSocketDisconnect:
        print("[ws/test.py] /ws/test disconnected")
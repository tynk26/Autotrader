# backend/ws/manager.py

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        disconnected = []

        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                disconnected.append(connection)

        for dead in disconnected:
            self.disconnect(dead)

# # backend/ws/manager.py

# from fastapi import WebSocket
# from typing import List
# import json


# class ConnectionManager:
#     def __init__(self):
#         self.active_connections: List[WebSocket] = []

#     async def connect(self, websocket: WebSocket):
#         await websocket.accept()
#         self.active_connections.append(websocket)
#         print(f"[manager.py] 연결 추가 | 현재 연결 수: {len(self.active_connections)}")

#     def disconnect(self, websocket: WebSocket):
#         self.active_connections.remove(websocket)
#         print(f"[manager.py] 연결 제거 | 현재 연결 수: {len(self.active_connections)}")

#     async def send_personal(self, message: dict, websocket: WebSocket):
#         await websocket.send_text(json.dumps(message))

#     async def broadcast(self, message: dict):
#         for connection in self.active_connections:
#             await connection.send_text(json.dumps(message))

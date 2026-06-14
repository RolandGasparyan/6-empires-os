from fastapi import APIRouter, WebSocket

router = APIRouter(tags=["websocket"])

class ConnectionManager:
    def __init__(self):
        self.active = set()
    async def connect(self, ws):
        await ws.accept()
        self.active.add(ws)
    def disconnect(self, ws):
        self.active.discard(ws)

mgr = ConnectionManager()

@router.websocket("/ws/updates")
async def ws_endpoint(ws: WebSocket):
    await mgr.connect(ws)
    try:
        while True:
            await ws.receive_text()
    except:
        mgr.disconnect(ws)

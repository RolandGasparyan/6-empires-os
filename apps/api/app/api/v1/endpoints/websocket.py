import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services import agent_state

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/updates")
async def ws_endpoint(ws: WebSocket):
    """
    Live digital-twin stream.

    On connect we send a full snapshot so the client starts in sync, then we
    forward every agent.status event the state engine emits. This is the
    snapshot-on-reconnect pattern from the system design — no lost updates.
    """
    await ws.accept()
    q = agent_state.subscribe()
    try:
        # 1) initial snapshot
        await ws.send_text(json.dumps({"type": "snapshot", "agents": agent_state.snapshot()}))
        # 2) live event forwarding
        while True:
            evt = await q.get()
            await ws.send_text(json.dumps(evt))
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        agent_state.unsubscribe(q)

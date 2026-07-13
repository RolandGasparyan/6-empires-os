import json
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from app.config import settings
from app.security.deps import get_websocket_user
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
    origin = ws.headers.get("origin")
    if not settings.is_allowed_origin(origin):
        await ws.close(code=4403, reason="Origin not allowed")
        return

    token = ws.query_params.get("token", "")
    authorization = ws.headers.get("authorization", "")
    if not token and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if not token:
        token = ws.cookies.get("empire_access", "")
        if token and not origin:
            await ws.close(code=4403, reason="Origin required for cookie authentication")
            return
    if not token:
        await ws.close(code=4401, reason="Authentication required")
        return
    try:
        await get_websocket_user(token)
    except HTTPException:
        await ws.close(code=4401, reason="Invalid authentication")
        return

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

"""OpenHuman Core integration.

Two roles are supported:

1. RUNTIME (inbound) — 6-EMPIRE *is* the OpenHuman Core runtime. The `/rpc`
   endpoint accepts JSON-RPC-style calls and requires the caller to present
   `Authorization: Bearer <OPENHUMAN_CORE_TOKEN>`. This is what gives meaning
   to the token you paste into the settings form.

2. CLIENT (outbound) — 6-EMPIRE connects to a *remote* runtime. The
   `/test-connection` endpoint takes a runtime URL + bearer token, calls the
   remote `/rpc` with a `ping`, and reports whether it answered.

Secrets are never returned to the client. The founder gate protects the
control-plane endpoints; the data-plane `/rpc` is protected by the bearer token.
"""
from __future__ import annotations

import asyncio
import hmac
import ipaddress
import socket
import time
import json
from typing import Any, Optional
from urllib.parse import urlsplit

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field, model_validator

from app.config import settings
from app.security.deps import require_cookie_origin, require_founder

router = APIRouter(prefix="/openhuman", tags=["openhuman"])


# --------------------------------------------------------------------------- #
# Control plane (founder-gated)
# --------------------------------------------------------------------------- #
@router.get("/status")
async def get_status(_=Depends(require_founder)) -> dict[str, Any]:
    """Report integration state without ever leaking the token itself."""
    token_set = bool(settings.OPENHUMAN_CORE_TOKEN)
    return {
        "connected": token_set,
        "runtime_enabled": token_set,
        "runtime_url": settings.OPENHUMAN_RUNTIME_URL or None,
        "oauth_configured": bool(settings.OPENHUMAN_CLIENT_ID and settings.OPENHUMAN_CLIENT_SECRET),
        "synced": {"health": 0, "activity": 0, "knowledge": 0},
    }


class TestConnectionRequest(BaseModel):
    runtime_url: str = Field(..., description="Remote runtime RPC URL, e.g. https://core.example.com/rpc")
    auth_token: Optional[str] = Field(
        None, description="Bearer token. If omitted, the server-configured OPENHUMAN_CORE_TOKEN is used."
    )


def _resolved_addresses(hostname: str, port: int) -> set[ipaddress.IPv4Address | ipaddress.IPv6Address]:
    try:
        return {
            ipaddress.ip_address(item[4][0])
            for item in socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
        }
    except socket.gaierror as exc:
        raise ValueError("runtime_url hostname could not be resolved") from exc


async def validate_runtime_url(raw_url: str) -> str:
    """Return a normalized public HTTP(S) URL or reject SSRF-capable targets."""
    url = raw_url.strip()
    try:
        parsed = urlsplit(url)
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="runtime_url is invalid") from exc
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise HTTPException(status_code=400, detail="runtime_url must be an absolute http:// or https:// URL")
    if parsed.username or parsed.password:
        raise HTTPException(status_code=400, detail="runtime_url must not include credentials")
    if parsed.fragment:
        raise HTTPException(status_code=400, detail="runtime_url must not include a fragment")

    try:
        literal = ipaddress.ip_address(parsed.hostname)
        addresses = {literal}
    except ValueError:
        try:
            addresses = await asyncio.to_thread(_resolved_addresses, parsed.hostname, port)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not addresses or any(not address.is_global for address in addresses):
        raise HTTPException(status_code=400, detail="runtime_url must resolve only to public addresses")
    return url


@router.post("/test-connection")
async def test_connection(
    req: TestConnectionRequest,
    _=Depends(require_founder),
    __=Depends(require_cookie_origin),
) -> dict[str, Any]:
    """Call a remote runtime's /rpc with a ping and report reachability.

    Mirrors the settings-form 'Test Connection' button. Never echoes the token.
    """
    token = req.auth_token or settings.OPENHUMAN_CORE_TOKEN
    if not token:
        raise HTTPException(status_code=400, detail="No auth token provided or configured.")
    url = await validate_runtime_url(req.runtime_url)

    payload = {"jsonrpc": "2.0", "id": 1, "method": "ping", "params": {}}
    started = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=False) as client:
            resp = await client.post(url, json=payload, headers={"Authorization": f"Bearer {token}"})
    except httpx.HTTPError as exc:
        return {"ok": False, "error": f"Could not reach runtime: {exc.__class__.__name__}"}

    latency_ms = round((time.perf_counter() - started) * 1000, 1)
    if resp.status_code == 200:
        return {"ok": True, "status_code": 200, "latency_ms": latency_ms, "detail": "Runtime reachable and authorized."}
    if resp.status_code in (401, 403):
        return {"ok": False, "status_code": resp.status_code, "latency_ms": latency_ms, "detail": "Reachable but token rejected."}
    return {"ok": False, "status_code": resp.status_code, "latency_ms": latency_ms, "detail": "Runtime returned an error."}


# --------------------------------------------------------------------------- #
# Data plane (bearer-token-gated) — 6-EMPIRE acting AS the runtime
# --------------------------------------------------------------------------- #
def require_core_token(authorization: str = Header(default="")) -> None:
    """Validate the inbound Authorization: Bearer <OPENHUMAN_CORE_TOKEN> header."""
    if not settings.OPENHUMAN_CORE_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Runtime not configured: set OPENHUMAN_CORE_TOKEN.",
        )
    scheme, _, presented = authorization.partition(" ")
    if scheme.lower() != "bearer" or not presented:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token.")
    if not hmac.compare_digest(presented, settings.OPENHUMAN_CORE_TOKEN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid runtime token.")


class RpcRequest(BaseModel):
    jsonrpc: str = "2.0"
    id: Any = None
    method: str = Field(min_length=1, max_length=100)
    params: dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_context_bounds(self) -> "RpcRequest":
        if len(json.dumps(self.params, default=str)) > 50_000:
            raise ValueError("params exceeds the context limit")
        items = self.params.get("items")
        if isinstance(items, list) and len(items) > 100:
            raise ValueError("memory.sync accepts at most 100 items")
        if isinstance(items, list) and any(len(json.dumps(item, default=str)) > 10_000 for item in items):
            raise ValueError("memory.sync item exceeds the per-item limit")
        return self


# Methods this runtime exposes. Extend as the Intelligence Core grows.
_SUPPORTED_METHODS = {"ping", "runtime.info", "memory.sync"}


@router.post("/rpc")
async def rpc(req: RpcRequest, _=Depends(require_core_token)) -> dict[str, Any]:
    """Minimal JSON-RPC 2.0 runtime endpoint, bearer-token protected."""
    if req.method == "ping":
        result: Any = {"pong": True, "ts": time.time()}
    elif req.method == "runtime.info":
        result = {"name": settings.APP_NAME, "env": settings.ENV, "methods": sorted(_SUPPORTED_METHODS)}
    elif req.method == "memory.sync":
        items = req.params.get("items", [])
        result = {"accepted": len(items) if isinstance(items, list) else 0}
    else:
        return {"jsonrpc": "2.0", "id": req.id, "error": {"code": -32601, "message": "Method not found"}}
    return {"jsonrpc": "2.0", "id": req.id, "result": result}

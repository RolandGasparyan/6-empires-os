import time

import jwt
import pytest
from starlette.responses import Response
from starlette.websockets import WebSocketDisconnect

from app.api.v1.endpoints.auth import _set_auth_cookies
from app.config import settings
from conftest import login_founder, register_founder


def test_founder_email_alone_never_grants_privileges(client):
    payload = {
        "email": settings.FOUNDER_EMAIL,
        "username": "founder",
        "password": "correct-horse-battery-staple",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 403

    response = client.post(
        "/api/v1/auth/register",
        headers={"X-Founder-Bootstrap-Token": "wrong-token"},
        json=payload,
    )
    assert response.status_code == 403

    response = register_founder(client)
    assert response.status_code == 201
    assert response.json() == {"message": "registered", "is_founder": True, "role": "founder"}


def test_login_refresh_rotation_logout_and_short_lived_cookies(client):
    response = login_founder(client)
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["refresh_token"] is None
    assert client.cookies.get("empire_access")
    old_refresh = client.cookies.get("empire_refresh")
    assert old_refresh

    payload = jwt.decode(body["access_token"], settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    assert payload["exp"] - time.time() <= settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60 + 1

    assert client.get("/api/v1/auth/me").status_code == 200
    refreshed = client.post("/api/v1/auth/refresh", headers={"Origin": "https://app.example.com"})
    assert refreshed.status_code == 200
    assert client.cookies.get("empire_refresh") != old_refresh

    replay = client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert replay.status_code == 401

    logged_out = client.post("/api/v1/auth/logout", headers={"Origin": "https://app.example.com"})
    assert logged_out.status_code == 200
    assert client.cookies.get("empire_access") is None
    assert client.cookies.get("empire_refresh") is None


def test_sensitive_reads_require_auth_and_websocket_checks_origin(client):
    for path in (
        "/api/v1/agents/strat/tasks",
        "/api/v1/agents/strat/memory",
        "/api/v1/chat/channels",
        "/api/v1/chat/channels/command/messages",
    ):
        assert client.get(path).status_code == 401

    login_founder(client)
    for path in (
        "/api/v1/agents/strat/tasks",
        "/api/v1/agents/strat/memory",
        "/api/v1/chat/channels",
        "/api/v1/chat/channels/command/messages",
    ):
        assert client.get(path).status_code == 200

    with client.websocket_connect(
        "/api/v1/ws/updates",
        headers={"origin": "https://app.example.com"},
    ) as websocket:
        assert websocket.receive_json()["type"] == "snapshot"

    with pytest.raises(WebSocketDisconnect) as rejected:
        with client.websocket_connect(
            "/api/v1/ws/updates",
            headers={"origin": "https://evil.example"},
        ):
            pass
    assert rejected.value.code == 4403


def test_duplicate_username_is_a_conflict(client):
    first = client.post(
        "/api/v1/auth/register",
        json={"email": "one@example.com", "username": "same", "password": "long-enough-password"},
    )
    assert first.status_code == 201
    second = client.post(
        "/api/v1/auth/register",
        json={"email": "two@example.com", "username": "same", "password": "long-enough-password"},
    )
    assert second.status_code == 409


def test_cookie_mutations_require_allowed_origin(client):
    login_founder(client)
    assert client.post("/api/v1/auth/refresh").status_code == 403
    assert client.post(
        "/api/v1/agents/strat/command",
        headers={"Origin": "https://evil.example"},
        json={"title": "blocked"},
    ).status_code == 403
    assert client.post(
        "/api/v1/agents/strat/command",
        headers={"Origin": "https://app.example.com"},
        json={"title": "allowed"},
    ).status_code == 200


def test_production_cookies_support_cross_site_render_hosts(monkeypatch):
    monkeypatch.setattr(settings, "ENV", "production")
    response = Response()
    _set_auth_cookies(response, "access-value", "refresh-value")
    headers = "\n".join(value.decode() for key, value in response.raw_headers if key == b"set-cookie")
    assert headers.count("SameSite=none") == 2
    assert headers.count("Secure") == 2
    assert headers.count("HttpOnly") == 2

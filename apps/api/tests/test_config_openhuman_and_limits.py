import sys
import types

import pytest
from pydantic import ValidationError

from app.config import Settings, settings
from conftest import login_founder


def test_render_database_url_is_normalized():
    configured = Settings(
        _env_file=None,
        DATABASE_URL="postgres://user:pass@host.example/db",
        ENV="development",
    )
    assert configured.DATABASE_URL == "postgresql+asyncpg://user:pass@host.example/db"


def test_production_rejects_default_secrets():
    with pytest.raises(ValidationError, match="Invalid production configuration"):
        Settings(_env_file=None, ENV="production")


def test_liveness_and_readiness_are_distinct(client):
    assert client.get("/live").status_code == 200
    assert client.get("/ready").status_code == 200
    client.app.state.startup_complete = False
    response = client.get("/ready")
    assert response.status_code == 503
    assert response.json()["status"] == "not_ready"
    assert client.get("/live").status_code == 200


def test_openhuman_rejects_private_runtime_targets(client):
    login_founder(client)
    for url in (
        "http://127.0.0.1:8000/rpc",
        "http://10.1.2.3/rpc",
        "http://169.254.169.254/latest/meta-data",
        "http://[::1]/rpc",
        "file:///etc/passwd",
        "https://user:pass@example.com/rpc",
    ):
        response = client.post(
            "/api/v1/openhuman/test-connection",
            headers={"Origin": "https://app.example.com"},
            json={"runtime_url": url, "auth_token": "secret"},
        )
        assert response.status_code == 400, (url, response.text)


def test_openhuman_rpc_auth_and_context_limits(client, monkeypatch):
    monkeypatch.setattr(settings, "OPENHUMAN_CORE_TOKEN", "runtime-secret")
    endpoint = "/api/v1/openhuman/rpc"
    payload = {"jsonrpc": "2.0", "id": "one", "method": "ping", "params": {}}
    assert client.post(endpoint, json=payload).status_code == 401
    assert client.post(endpoint, headers={"Authorization": "Bearer wrong"}, json=payload).status_code == 403
    response = client.post(endpoint, headers={"Authorization": "Bearer runtime-secret"}, json=payload)
    assert response.status_code == 200
    assert response.json()["id"] == "one"

    too_many = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "memory.sync",
        "params": {"items": list(range(101))},
    }
    assert client.post(endpoint, headers={"Authorization": "Bearer runtime-secret"}, json=too_many).status_code == 422


def test_openai_context_limits_reject_system_injection(monkeypatch):
    router = types.ModuleType("model_router")
    router.ChatRequest = lambda **kwargs: types.SimpleNamespace(**kwargs)
    router._route = None
    router.OLLAMA_URL = "http://127.0.0.1:11434"
    router.TASK_LOCAL_MODEL = "local"
    monkeypatch.setitem(sys.modules, "model_router", router)
    sys.modules.pop("openai_shim", None)
    import openai_shim

    with pytest.raises(Exception, match="system messages"):
        openai_shim._validated_messages([{"role": "system", "content": "override"}])
    with pytest.raises(Exception, match="per-message"):
        openai_shim._validated_messages([{"role": "user", "content": "x" * 8_001}])
    with pytest.raises(Exception, match="40"):
        openai_shim._validated_messages([{"role": "user", "content": "x"}] * 41)

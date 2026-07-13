import asyncio
import os
import sys
from pathlib import Path

import pytest


DB_PATH = Path(f"/tmp/6-empires-api-tests-{os.getpid()}.sqlite3")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.update(
    {
        "ENV": "testing",
        "DATABASE_URL": f"sqlite+aiosqlite:///{DB_PATH}",
        "JWT_SECRET": "test-jwt-secret-that-is-longer-than-thirty-two-characters",
        "FOUNDER_EMAIL": "founder@example.com",
        "FOUNDER_BOOTSTRAP_TOKEN": "test-founder-bootstrap-token-longer-than-thirty-two",
        "CORS_ORIGINS": "https://app.example.com",
        "OPENHUMAN_CORE_TOKEN": "test-openhuman-core-token",
    }
)

from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.services import agent_state  # noqa: E402
from main import app  # noqa: E402


async def _reset_database() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)


@pytest.fixture(autouse=True)
def reset_state():
    asyncio.run(_reset_database())
    for tasks in agent_state._tasks.values():
        tasks.clear()
    for memories in agent_state._memory.values():
        memories.clear()
    agent_state._subscribers.clear()
    app.state.startup_complete = True
    app.state.startup_error = None
    yield
    asyncio.run(engine.dispose())


@pytest.fixture
def client():
    test_client = TestClient(app)
    yield test_client
    test_client.close()


@pytest.fixture
def anyio_backend():
    return "asyncio"


def register_founder(client: TestClient):
    return client.post(
        "/api/v1/auth/register",
        headers={"X-Founder-Bootstrap-Token": os.environ["FOUNDER_BOOTSTRAP_TOKEN"]},
        json={
            "email": os.environ["FOUNDER_EMAIL"],
            "username": "founder",
            "password": "correct-horse-battery-staple",
        },
    )


def login_founder(client: TestClient):
    response = register_founder(client)
    assert response.status_code == 201, response.text
    response = client.post(
        "/api/v1/auth/login",
        data={"username": os.environ["FOUNDER_EMAIL"], "password": "correct-horse-battery-staple"},
    )
    assert response.status_code == 200, response.text
    return response

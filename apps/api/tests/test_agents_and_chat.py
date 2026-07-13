import asyncio
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from app.database import async_session
from app.models.agent_runtime import TaskRecord
from app.models.message import MessageRecord
from app.services import agent_brain, agent_repo, agent_state
from conftest import login_founder


def test_command_is_durable_and_uses_full_uuid(client):
    login_founder(client)
    response = client.post(
        "/api/v1/agents/strat/command",
        headers={"Origin": "https://app.example.com"},
        json={"title": "Review risk"},
    )
    assert response.status_code == 200
    task = response.json()["task"]
    assert str(uuid.UUID(task["id"])) == task["id"]
    assert task["state"] == "queued"

    async def load():
        async with async_session() as session:
            return await session.get(TaskRecord, task["id"])

    record = asyncio.run(load())
    assert record is not None
    assert record.title == "Review risk"


def test_command_returns_503_when_durable_queue_fails(client, monkeypatch):
    login_founder(client)

    async def fail(_task):
        raise agent_repo.AgentRepositoryError("unavailable")

    monkeypatch.setattr(agent_repo, "upsert_task", fail)
    response = client.post(
        "/api/v1/agents/strat/command",
        headers={"Origin": "https://app.example.com"},
        json={"title": "Do not lose me"},
    )
    assert response.status_code == 503
    assert agent_state.tasks_for("strat") == []


@pytest.mark.anyio
async def test_agent_exception_becomes_durable_failed_task(monkeypatch):
    task = await agent_state.enqueue_task("strat", "Failure path")
    stored = agent_state._tasks["strat"][0]

    async def fail(*_args, **_kwargs):
        raise RuntimeError("provider broke")

    monkeypatch.setattr(agent_brain, "think", fail)
    await agent_state._process_task(agent_state.get_agent("strat"), stored)
    assert stored.state == "failed"
    assert stored.completed_at
    assert "RuntimeError" in stored.error

    async with async_session() as session:
        record = await session.get(TaskRecord, task["id"])
        assert record.state == "failed"
        assert "RuntimeError" in record.error


@pytest.mark.anyio
async def test_hydration_recovers_interrupted_active_task():
    task = await agent_state.enqueue_task("strat", "Recover me")
    stored = agent_state._tasks["strat"][0]
    await agent_state._transition(stored, state="active")

    await agent_state.hydrate()
    recovered = agent_state.tasks_for("strat")
    assert len(recovered) == 1
    assert recovered[0]["id"] == task["id"]
    assert recovered[0]["state"] == "queued"

    async with async_session() as session:
        record = await session.get(TaskRecord, task["id"])
        assert record.state == "queued"


def test_chat_history_returns_newest_limit_in_display_order(client):
    login_founder(client)
    start = datetime(2026, 1, 1, tzinfo=timezone.utc)

    async def seed():
        async with async_session() as session:
            session.add_all(
                [
                    MessageRecord(
                        id=str(uuid.uuid4()),
                        channel="command",
                        sender="founder",
                        body=f"message-{index:02d}",
                        mentions=[],
                        created_at=start + timedelta(minutes=index),
                    )
                    for index in range(55)
                ]
            )
            await session.commit()

    asyncio.run(seed())
    response = client.get("/api/v1/chat/channels/command/messages?limit=50")
    assert response.status_code == 200
    bodies = [message["body"] for message in response.json()["messages"]]
    assert bodies == [f"message-{index:02d}" for index in range(5, 55)]

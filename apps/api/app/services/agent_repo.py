"""Durable persistence operations for the live agent engine."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import cast

from sqlalchemy import select

from app.database import async_session
from app.models.agent_runtime import MemoryRecord, TaskRecord


class AgentRepositoryError(RuntimeError):
    """Raised when an agent state transition could not be committed."""


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse(ts: str | None) -> datetime | None:
    if not ts:
        return None
    try:
        parsed = datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _iso(ts: datetime | None) -> str | None:
    if ts is None:
        return None
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return ts.astimezone(timezone.utc).isoformat()


async def _upsert_task_in_session(session, task: dict) -> None:
    existing = await session.get(TaskRecord, task["id"])
    if existing is None:
        existing = TaskRecord(
            id=task["id"],
            agent_key=task["agent_key"],
            title=task["title"],
            created_at=_parse(task.get("created_at")) or _now(),
        )
        session.add(existing)
    existing.state = task["state"]
    existing.result = task.get("result")
    existing.error = task.get("error")
    if task["state"] == "active" and existing.started_at is None:
        existing.started_at = _now()
    if task.get("completed_at"):
        existing.completed_at = _parse(task["completed_at"])


async def upsert_task(task: dict) -> None:
    try:
        async with async_session() as session:
            await _upsert_task_in_session(session, task)
            await session.commit()
    except Exception as exc:
        raise AgentRepositoryError("task state could not be persisted") from exc


async def add_memory(memory: dict) -> None:
    try:
        async with async_session() as session:
            session.add(
                MemoryRecord(
                    id=memory["id"],
                    agent_key=memory["agent_key"],
                    kind=memory["kind"],
                    content=memory["content"],
                    importance=memory.get("importance", 0.5),
                    created_at=_parse(memory.get("created_at")) or _now(),
                )
            )
            await session.commit()
    except Exception as exc:
        raise AgentRepositoryError("agent memory could not be persisted") from exc


async def complete_task_with_memory(task: dict, memory: dict) -> None:
    """Atomically persist task completion and its resulting memory."""
    try:
        async with async_session() as session:
            await _upsert_task_in_session(session, task)
            session.add(
                MemoryRecord(
                    id=memory["id"],
                    agent_key=memory["agent_key"],
                    kind=memory["kind"],
                    content=memory["content"],
                    importance=memory.get("importance", 0.5),
                    created_at=_parse(memory.get("created_at")) or _now(),
                )
            )
            await session.commit()
    except Exception as exc:
        raise AgentRepositoryError("task completion could not be persisted") from exc


async def load_state() -> tuple[dict[str, list[dict]], dict[str, list[dict]]]:
    tasks: dict[str, list[dict]] = {}
    memory: dict[str, list[dict]] = {}
    try:
        async with async_session() as session:
            rows = (await session.execute(select(TaskRecord).order_by(TaskRecord.created_at))).scalars()
            for row in rows:
                tasks.setdefault(str(row.agent_key), []).append(
                    {
                        "id": row.id,
                        "agent_key": row.agent_key,
                        "title": row.title,
                        "state": row.state,
                        "result": row.result,
                        "error": row.error,
                        "created_at": _iso(cast(datetime | None, row.created_at)) or "",
                        "completed_at": _iso(cast(datetime | None, row.completed_at)),
                    }
                )
            rows = (await session.execute(select(MemoryRecord).order_by(MemoryRecord.created_at))).scalars()
            for row in rows:
                memory.setdefault(str(row.agent_key), []).append(
                    {
                        "id": row.id,
                        "agent_key": row.agent_key,
                        "kind": row.kind,
                        "content": row.content,
                        "created_at": _iso(cast(datetime | None, row.created_at)) or "",
                    }
                )
    except Exception as exc:
        raise AgentRepositoryError("agent state could not be loaded") from exc
    return tasks, memory

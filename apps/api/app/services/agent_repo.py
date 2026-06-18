"""
Persistence repository for the agent loop (Phase E).

Bridges the in-memory engine to Postgres. Every write goes through here; all
operations degrade gracefully if the DB is unreachable so the live twin keeps
running (state simply isn't persisted that tick). On boot, load_state() hydrates
the engine from the tables so a restart no longer wipes tasks/memory.
"""
from __future__ import annotations
from datetime import datetime
from sqlalchemy import select, delete
from app.database import async_session
from app.models.agent_runtime import TaskRecord, MemoryRecord

# Toggle so a totally DB-less dev run still works (mirrors useHQ mock path).
_ENABLED = True


def _parse(ts: str | None) -> datetime | None:
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return None


async def upsert_task(t: dict) -> None:
    if not _ENABLED:
        return
    try:
        async with async_session() as s:
            existing = await s.get(TaskRecord, t["id"])
            if existing is None:
                existing = TaskRecord(id=t["id"], agent_key=t["agent_key"],
                                      title=t["title"], created_at=_parse(t.get("created_at")) or datetime.utcnow())
                s.add(existing)
            existing.state = t["state"]
            existing.result = t.get("result")
            if t["state"] == "active" and existing.started_at is None:
                existing.started_at = datetime.utcnow()
            if t.get("completed_at"):
                existing.completed_at = _parse(t["completed_at"])
            await s.commit()
    except Exception as exc:
        print(f"[repo] upsert_task skipped: {exc}")


async def add_memory(m: dict) -> None:
    if not _ENABLED:
        return
    try:
        async with async_session() as s:
            s.add(MemoryRecord(id=m["id"], agent_key=m["agent_key"], kind=m["kind"],
                               content=m["content"], importance=m.get("importance", 0.5),
                               created_at=_parse(m.get("created_at")) or datetime.utcnow()))
            await s.commit()
    except Exception as exc:
        print(f"[repo] add_memory skipped: {exc}")


async def load_state() -> tuple[dict[str, list[dict]], dict[str, list[dict]]]:
    """Return (tasks_by_agent, memory_by_agent) from the DB for hydration."""
    tasks: dict[str, list[dict]] = {}
    memory: dict[str, list[dict]] = {}
    if not _ENABLED:
        return tasks, memory
    try:
        async with async_session() as s:
            for r in (await s.execute(select(TaskRecord).order_by(TaskRecord.created_at))).scalars():
                tasks.setdefault(r.agent_key, []).append({
                    "id": r.id, "agent_key": r.agent_key, "title": r.title, "state": r.state,
                    "result": r.result, "created_at": (r.created_at.isoformat() if r.created_at else ""),
                    "completed_at": (r.completed_at.isoformat() if r.completed_at else None),
                })
            for r in (await s.execute(select(MemoryRecord).order_by(MemoryRecord.created_at))).scalars():
                memory.setdefault(r.agent_key, []).append({
                    "id": r.id, "agent_key": r.agent_key, "kind": r.kind, "content": r.content,
                    "created_at": (r.created_at.isoformat() if r.created_at else ""),
                })
    except Exception as exc:
        print(f"[repo] load_state skipped: {exc}")
    return tasks, memory

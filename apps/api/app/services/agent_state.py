"""
Agent state engine — the live source of truth for the digital twin.

In-memory for now (single process). The same interface (snapshot + an async
event stream) is what the production orchestrator + Redis pub/sub will expose,
so the API and WebSocket code do not change when we scale out.

Phase A: live status + load stream.
Phase B: task queue (queued -> active -> done), agent worker loop, and a
         per-agent memory log written from task results.
"""
from __future__ import annotations
import asyncio
import random
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone

from app.services import agent_brain
from app.services import agent_repo

STATUSES = ["ANALYZING", "RESEARCHING", "MONITORING", "TRADING", "WRITING", "THINKING"]


@dataclass
class Task:
    id: str
    agent_key: str
    title: str
    state: str          # queued | active | done
    result: str | None = None
    created_at: str = ""
    completed_at: str | None = None


@dataclass
class Memory:
    id: str
    agent_key: str
    kind: str           # decision | report | sync | ingest
    content: str
    created_at: str


@dataclass
class Agent:
    key: str
    name: str
    role: str
    division: str
    color: str
    status: str
    load: float
    throughput: int


_AGENTS: dict[str, Agent] = {
    a.key: a for a in [
        Agent("strat", "Chief Strategist", "WAR ROOM",       "Strategy",     "#3fe0ff", "ANALYZING",   0.82, 142),
        Agent("data",  "Data Hunter",      "INTELLIGENCE",   "Research",     "#34f5a0", "RESEARCHING", 0.76, 168),
        Agent("risk",  "Risk Guardian",    "SECURITY HQ",    "Risk",         "#ff5d8f", "MONITORING",  0.74, 96),
        Agent("scout", "Market Scout",     "TRADING FLOOR",  "Capital",      "#e3ad28", "TRADING",     0.71, 311),
        Agent("news",  "News Analyst",     "MEDIA CENTER",   "Media",        "#a78bfa", "WRITING",     0.69, 58),
        Agent("trend", "Trend Tracker",    "PREDICTION LAB", "Intelligence", "#f0997b", "THINKING",    0.68, 71),
    ]
}

_tasks: dict[str, list[Task]] = {k: [] for k in _AGENTS}
_memory: dict[str, list[Memory]] = {k: [] for k in _AGENTS}
_subscribers: set[asyncio.Queue] = set()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---- queries ----
def snapshot() -> list[dict]:
    return [asdict(a) for a in _AGENTS.values()]


def get_agent(key: str) -> Agent | None:
    return _AGENTS.get(key)


def tasks_for(key: str) -> list[dict]:
    return [asdict(t) for t in _tasks.get(key, [])][-20:]


def memory_for(key: str) -> list[dict]:
    return [asdict(m) for m in _memory.get(key, [])][-20:]


async def hydrate() -> None:
    """Load persisted tasks + memory from the DB into the engine on startup.
    This is what makes a restart no longer wipe agent state (Phase E)."""
    tasks_by, mem_by = await agent_repo.load_state()
    loaded_t = loaded_m = 0
    for key, rows in tasks_by.items():
        if key not in _tasks:
            continue
        for r in rows:
            _tasks[key].append(Task(id=r["id"], agent_key=key, title=r["title"],
                                    state=r["state"], result=r.get("result"),
                                    created_at=r.get("created_at", ""),
                                    completed_at=r.get("completed_at")))
            loaded_t += 1
    for key, rows in mem_by.items():
        if key not in _memory:
            continue
        for r in rows:
            _memory[key].append(Memory(id=r["id"], agent_key=key, kind=r["kind"],
                                       content=r["content"], created_at=r.get("created_at", "")))
            loaded_m += 1
    if loaded_t or loaded_m:
        print(f"[hydrate] restored {loaded_t} tasks, {loaded_m} memory entries from DB")


# ---- events ----
def subscribe() -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue(maxsize=200)
    _subscribers.add(q)
    return q


def unsubscribe(q: asyncio.Queue) -> None:
    _subscribers.discard(q)


async def _emit(evt: dict) -> None:
    for q in list(_subscribers):
        try:
            q.put_nowait(evt)
        except asyncio.QueueFull:
            pass


async def _emit_status(agent: Agent) -> None:
    await _emit({
        "type": "agent.status", "id": agent.key, "name": agent.name,
        "status": agent.status, "load": round(agent.load, 3),
        "throughput": agent.throughput, "ts": _now(),
    })


# ---- task lifecycle ----
def enqueue_task(agent_key: str, title: str) -> dict | None:
    agent = _AGENTS.get(agent_key)
    if not agent:
        return None
    t = Task(id=str(uuid.uuid4())[:8], agent_key=agent_key, title=title,
             state="queued", created_at=_now())
    _tasks[agent_key].append(t)
    # Persist the queued task (fire-and-forget; safe if DB is down).
    asyncio.create_task(agent_repo.upsert_task(asdict(t)))
    return asdict(t)


async def _process_task(agent: Agent, task: Task) -> None:
    task.state = "active"
    await agent_repo.upsert_task(asdict(task))
    await _emit({"type": "task.active", "id": task.id, "agent": agent.key, "title": task.title, "ts": _now()})
    # think (LLM or fallback) with the agent's recent memory as context
    context = [m.content for m in _memory[agent.key][-5:]]
    result = await agent_brain.think(agent.name, agent.division, task.title, context)
    await asyncio.sleep(random.uniform(0.6, 1.4))  # simulate work time
    task.state = "done"
    task.result = result
    task.completed_at = _now()
    await agent_repo.upsert_task(asdict(task))
    await _emit({"type": "task.done", "id": task.id, "agent": agent.key, "title": task.title, "result": result, "ts": _now()})
    # persist a memory line
    mem = Memory(id=str(uuid.uuid4())[:8], agent_key=agent.key, kind="decision", content=result, created_at=_now())
    _memory[agent.key].append(mem)
    await agent_repo.add_memory(asdict(mem))
    await _emit({"type": "memory.add", "agent": agent.key, "kind": mem.kind, "content": mem.content, "ts": _now()})


# ---- background loops ----
async def run_engine(interval: float = 2.5) -> None:
    """Idle 'life': nudge load, occasionally flip status."""
    while True:
        await asyncio.sleep(interval)
        for agent in _AGENTS.values():
            agent.load = max(0.1, min(0.98, agent.load + random.uniform(-0.06, 0.06)))
            agent.throughput = max(10, agent.throughput + random.randint(-8, 8))
            if random.random() > 0.78:
                agent.status = random.choice(STATUSES)
                await _emit_status(agent)
            elif random.random() > 0.5:
                await _emit_status(agent)


async def run_worker(interval: float = 1.0) -> None:
    """Agent worker: pick the oldest queued task per agent and process it."""
    while True:
        await asyncio.sleep(interval)
        for agent in _AGENTS.values():
            queued = [t for t in _tasks[agent.key] if t.state == "queued"]
            if queued:
                await _process_task(agent, queued[0])

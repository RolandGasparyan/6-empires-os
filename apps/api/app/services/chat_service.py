"""
Phase C — Command Chat service.

A founder posts a message in a channel, optionally @mentioning agents (@strat,
@all, or by name). The message persists; mentioned agents respond through the
agent brain (LLM or fallback) using their recent memory as context. Every
message — founder and agent — persists and streams over the twin as message.new.
"""
from __future__ import annotations
import asyncio
import re
import uuid
from datetime import datetime
from sqlalchemy import select
from app.database import async_session
from app.models.message import MessageRecord
from app.services import agent_state, agent_brain

CHANNELS = [
    {"key": "command",   "name": "Command Channel", "desc": "General command & strategy"},
    {"key": "trading",   "name": "Trading Alerts",  "desc": "Market signals & execution"},
    {"key": "risk",      "name": "Risk Control",    "desc": "Risk management room"},
    {"key": "ops",       "name": "Internal Ops",    "desc": "Operations & execution"},
]

# name/alias → agent key, for @mention resolution
def _alias_map() -> dict[str, str]:
    m: dict[str, str] = {}
    for a in agent_state.snapshot():
        m[a["key"]] = a["key"]
        m[a["name"].lower().replace(" ", "")] = a["key"]
        first = a["name"].split()[0].lower()
        m.setdefault(first, a["key"])
    return m


def _now() -> str:
    return datetime.now(datetime.now().astimezone().tzinfo).isoformat()


def parse_mentions(body: str) -> list[str]:
    """Return resolved agent keys mentioned via @handle, or ['all']."""
    tokens = re.findall(r"@([a-zA-Z_]+)", body)
    if any(t.lower() == "all" for t in tokens):
        return ["all"]
    amap = _alias_map()
    keys: list[str] = []
    for t in tokens:
        k = amap.get(t.lower())
        if k and k not in keys:
            keys.append(k)
    return keys


async def _persist(channel: str, sender: str, body: str, agent_key: str | None, mentions: list[str]) -> dict:
    mid = str(uuid.uuid4())[:8]
    created = datetime.utcnow()
    rec = {"id": mid, "channel": channel, "sender": sender, "agent_key": agent_key,
           "body": body, "mentions": mentions, "created_at": created.isoformat()}
    try:
        async with async_session() as s:
            s.add(MessageRecord(id=mid, channel=channel, sender=sender, agent_key=agent_key,
                                body=body, mentions=mentions, created_at=created))
            await s.commit()
    except Exception as exc:
        print(f"[chat] persist skipped: {exc}")
    return rec


async def _emit(rec: dict) -> None:
    await agent_state._emit({"type": "message.new", **rec})


async def post_message(channel: str, body: str, sender: str = "founder") -> dict:
    """Persist a founder/system message, emit it, then trigger agent replies."""
    mentions = parse_mentions(body)
    rec = await _persist(channel, sender, body, None, mentions)
    await _emit(rec)
    # resolve which agents respond
    if mentions == ["all"]:
        targets = [a["key"] for a in agent_state.snapshot()]
    else:
        targets = mentions
    if targets:
        asyncio.create_task(_agents_reply(channel, body, targets))
    return rec


async def _agents_reply(channel: str, prompt: str, targets: list[str]) -> None:
    for key in targets:
        agent = agent_state.get_agent(key)
        if not agent:
            continue
        context = [m["content"] for m in agent_state.memory_for(key)[-5:]]
        reply = await agent_brain.think(agent.name, agent.division, prompt.replace("@all", "").strip(), context)
        rec = await _persist(channel, "agent", f"{reply}", key, [])
        await _emit(rec)
        await asyncio.sleep(0.3)  # natural stagger when @all fans out


async def list_messages(channel: str, limit: int = 50) -> list[dict]:
    try:
        async with async_session() as s:
            rows = (await s.execute(
                select(MessageRecord).where(MessageRecord.channel == channel)
                .order_by(MessageRecord.created_at).limit(limit)
            )).scalars().all()
            return [{"id": r.id, "channel": r.channel, "sender": r.sender, "agent_key": r.agent_key,
                     "body": r.body, "mentions": r.mentions or [],
                     "created_at": r.created_at.isoformat() if r.created_at else ""} for r in rows]
    except Exception as exc:
        print(f"[chat] list skipped: {exc}")
        return []

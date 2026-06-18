"""
Phase E persistence — runtime tables for the agent loop.

Implements the MASTER-ARCHITECTURE data model for `tasks` and `agent_memory`
so agent work survives a process restart. Uses string ids/keys to round-trip
the in-memory engine's dataclasses 1:1 (no UUID coercion needed).
"""
from sqlalchemy import Column, String, Text, DateTime, Float, Index
from datetime import datetime
from app.database import Base


class TaskRecord(Base):
    __tablename__ = "tasks"

    id = Column(String(16), primary_key=True)
    agent_key = Column(String(32), nullable=False, index=True)
    title = Column(Text, nullable=False)
    state = Column(String(16), nullable=False, index=True)  # queued|active|done|failed
    result = Column(Text)
    error = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)


class MemoryRecord(Base):
    __tablename__ = "agent_memory"

    id = Column(String(16), primary_key=True)
    agent_key = Column(String(32), nullable=False, index=True)
    kind = Column(String(16), nullable=False)  # decision|report|sync|ingest
    content = Column(Text, nullable=False)
    vector_id = Column(String(64))
    importance = Column(Float, default=0.5)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


Index("idx_tasks_agent_state", TaskRecord.agent_key, TaskRecord.state, TaskRecord.created_at)
Index("idx_memory_agent_created", MemoryRecord.agent_key, MemoryRecord.created_at)

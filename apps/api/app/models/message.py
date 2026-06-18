"""
Phase C — chat messages. Implements the MASTER-ARCHITECTURE `messages` table:
founder/agent/system posts in channels, with @mentions. Persisted so the
command channel survives restarts (builds on Phase E persistence).
"""
from sqlalchemy import Column, String, Text, DateTime, JSON, Index
from datetime import datetime
from app.database import Base


class MessageRecord(Base):
    __tablename__ = "messages"

    id = Column(String(16), primary_key=True)
    channel = Column(String(40), nullable=False, index=True)
    sender = Column(String(16), nullable=False)        # founder | agent | system
    agent_key = Column(String(32))                     # set when sender == agent
    body = Column(Text, nullable=False)
    mentions = Column(JSON)                             # list[str] of agent keys / 'all'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


Index("idx_messages_channel_created", MessageRecord.channel, MessageRecord.created_at)

from sqlalchemy import Column, String, DateTime, JSON, Boolean, Uuid
import uuid
from datetime import datetime, timezone
from app.database import Base

class Agent(Base):
    __tablename__ = "agents"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    role = Column(String(100), nullable=False)
    status = Column(String(50), default="idle", index=True)
    config = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

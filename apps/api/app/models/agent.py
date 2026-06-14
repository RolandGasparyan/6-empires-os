from sqlalchemy import Column, String, DateTime, JSON, Boolean, Integer, Float, ARRAY
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database import Base

class Agent(Base):
    __tablename__ = "agents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    role = Column(String(100), nullable=False)
    status = Column(String(50), default="idle", index=True)
    config = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

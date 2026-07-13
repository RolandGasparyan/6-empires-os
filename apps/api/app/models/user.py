from sqlalchemy import Column, String, Boolean, DateTime, Uuid, ForeignKey
import uuid
from datetime import datetime, timezone
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(String(20), default="viewer", nullable=False)  # founder|operator|viewer
    is_active = Column(Boolean, default=True, index=True)
    is_admin = Column(Boolean, default=False)  # kept for compatibility; founder == is_admin
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(128), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

from sqlalchemy import Column, String, DateTime, JSON, Boolean, Float, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database import Base

class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    document_type = Column(String(50), nullable=False, index=True)
    metadata = Column(JSON)
    indexed = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

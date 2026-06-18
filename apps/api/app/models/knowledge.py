from sqlalchemy import Column, String, DateTime, JSON, Boolean, Text, Uuid
import uuid
from datetime import datetime
from app.database import Base


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    document_type = Column(String(50), nullable=False, index=True)
    # NOTE: attribute renamed from `metadata` (reserved by SQLAlchemy Declarative)
    # to `doc_metadata`; the underlying DB column is still named "metadata".
    doc_metadata = Column("metadata", JSON)
    indexed = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

"""
Document Chunk Model - Vector Embeddings Storage.

Represents document chunks with vector embeddings for semantic search.
Uses pgvector extension for the embedding column.
"""

from sqlalchemy import Column, Text, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import Optional, TYPE_CHECKING, Any
from datetime import datetime
import uuid

from pgvector.sqlalchemy import Vector
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.cabinet import Cabinet


class DocumentChunk(Base):
    """
    Document Chunk - Master Knowledge Table with Vector Embeddings.
    
    This is the unified vector storage table for all document chunks.
    The source_type field distinguishes the origin:
    - 'upload': User-uploaded documents
    - 'n8n_legacy': Migrated from old n8n vectors
    - 'scraped_law': Web-scraped legal documents
    
    Uses pgvector for embedding columns.
    """
    
    __tablename__ = "document_chunks"
    
    # Primary Key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()")
    )
    
    # Foreign Keys
    cabinet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False
    )
    document_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True
    )
    
    # Content
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Vector Embeddings (pgvector)
    # Default embedding column (Gemini embeddings)
    embedding: Mapped[Optional[Any]] = mapped_column(
        Vector(768),  # Gemini embedding dimension
        nullable=True
    )
    # OpenAI embeddings (text-embedding-3-small = 1536 dims)
    embedding_openai: Mapped[Optional[Any]] = mapped_column(
        Vector(1536),
        nullable=True
    )
    
    # Metadata (renamed to avoid SQLAlchemy reserved name conflict)
    chunk_metadata: Mapped[Optional[dict]] = mapped_column(
        "metadata",  # Actual DB column name
        JSONB,
        server_default=text("'{}'::jsonb"),
        nullable=True
    )
    
    # Source Type (for unified vector storage)
    source_type: Mapped[Optional[str]] = mapped_column(
        Text,
        server_default=text("'upload'::text"),
        nullable=True
    )
    
    # Timestamp
    created_at: Mapped[Optional[datetime]] = mapped_column(
        server_default=text("now()"),
        nullable=True
    )
    
    # Relationships
    cabinet: Mapped["Cabinet"] = relationship(
        "Cabinet",
        back_populates="document_chunks",
        lazy="selectin"
    )
    
    def __repr__(self) -> str:
        content_preview = self.content[:50] + "..." if len(self.content) > 50 else self.content
        return f"<DocumentChunk(id={self.id}, source_type='{self.source_type}', content='{content_preview}')>"

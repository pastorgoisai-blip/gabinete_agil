"""
Demand Model - Citizen Requests/Tickets.

Represents demands/requests from citizens that need to be handled
by the cabinet staff.
"""

from sqlalchemy import Column, Text, BigInteger, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import Optional, TYPE_CHECKING
from datetime import datetime
import uuid

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.cabinet import Cabinet


class Demand(Base, TimestampMixin):
    """
    Demand entity - Citizen requests and tickets.
    
    Each demand belongs to a cabinet and tracks requests from citizens
    that need resolution by the cabinet staff.
    
    Note: ID is BigInt (auto-increment), NOT UUID.
    """
    
    __tablename__ = "demands"
    
    # Primary Key - BigInt Identity (NOT UUID)
    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )
    
    # Foreign Key to Cabinet
    cabinet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False
    )
    
    # Core Fields
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    beneficiary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    author: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Status & Priority
    status: Mapped[Optional[str]] = mapped_column(
        Text,
        server_default=text("'Pendente'::text"),
        nullable=True
    )
    priority: Mapped[Optional[str]] = mapped_column(
        Text,
        server_default=text("'Média'::text"),
        nullable=True
    )
    
    # Observations & Assignment
    obs: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assigned_to: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # CityHall Integration (Protocolo Fantasma)
    external_id: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="External protocol ID from CityHall API"
    )
    sync_status: Mapped[Optional[str]] = mapped_column(
        Text,
        server_default=text("'pending'::text"),
        nullable=True,
        comment="Sync status: pending, synced, error"
    )
    last_sync_error: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Last synchronization error message"
    )
    
    # Audit
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True
    )
    
    # Relationships
    cabinet: Mapped["Cabinet"] = relationship(
        "Cabinet",
        back_populates="demands",
        lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<Demand(id={self.id}, title='{self.title[:30]}...', status='{self.status}')>"

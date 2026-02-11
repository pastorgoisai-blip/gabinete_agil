"""
Cabinet Model - Main Tenant Entity.

Represents a political cabinet (gabinete) that is the primary tenant
for multi-tenancy isolation.
"""

from sqlalchemy import (
    Column, String, Text, Boolean, Numeric, Date, BigInteger,
    CheckConstraint, text
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import Optional, TYPE_CHECKING
from datetime import datetime, date
import uuid

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.demand import Demand
    from app.models.agent import AgentConfiguration, AgentLog
    from app.models.document import DocumentChunk


class Cabinet(Base, TimestampMixin):
    """
    Cabinet entity - Primary tenant for the Gabinete Ágil system.
    
    Each cabinet represents a political office with its own data isolation.
    Relationships with other entities are established through cabinet_id FK.
    """
    
    __tablename__ = "cabinets"
    __table_args__ = (
        CheckConstraint(
            "plan = ANY (ARRAY['free'::text, 'pro'::text, 'enterprise'::text])",
            name="cabinets_plan_check"
        ),
        CheckConstraint(
            "status = ANY (ARRAY['active'::text, 'trial'::text, 'suspended'::text, 'archived'::text])",
            name="cabinets_status_check"
        ),
    )
    
    # Primary Key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()")
    )
    
    # Core Fields
    name: Mapped[str] = mapped_column(Text, nullable=False)
    plan: Mapped[Optional[str]] = mapped_column(Text, server_default=text("'free'::text"))
    status: Mapped[Optional[str]] = mapped_column(Text, server_default=text("'active'::text"))
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        server_default=text("auth.uid()"),
        nullable=True
    )
    
    # Parliamentary Info
    parliamentary_name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parliamentary_party: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    parliamentary_photo: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    official_name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    official_title: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Letterhead Settings
    header_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    footer_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    use_letterhead: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text("false"))
    
    # Billing & Subscription
    plan_tier: Mapped[Optional[str]] = mapped_column(Text, server_default=text("'basic'::text"))
    mrr_value: Mapped[Optional[Numeric]] = mapped_column(Numeric, server_default=text("0"))
    payment_method: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    next_payment: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # API Keys (Encrypted)
    gemini_api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    openai_api_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    agent_access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True, unique=True)
    
    # Google Calendar Integration
    google_access_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    google_refresh_token: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    google_token_expires_at: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    google_calendar_id: Mapped[Optional[str]] = mapped_column(
        Text,
        server_default=text("'primary'::text"),
        nullable=True
    )
    google_email: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    demands: Mapped[list["Demand"]] = relationship(
        "Demand",
        back_populates="cabinet",
        lazy="selectin"
    )
    agent_configuration: Mapped[Optional["AgentConfiguration"]] = relationship(
        "AgentConfiguration",
        back_populates="cabinet",
        uselist=False,
        lazy="selectin"
    )
    agent_logs: Mapped[list["AgentLog"]] = relationship(
        "AgentLog",
        back_populates="cabinet",
        lazy="selectin"
    )
    document_chunks: Mapped[list["DocumentChunk"]] = relationship(
        "DocumentChunk",
        back_populates="cabinet",
        lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<Cabinet(id={self.id}, name='{self.name}', plan='{self.plan}')>"

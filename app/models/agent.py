"""
Agent Models - AI Agent Configuration and Logs.

Contains models for:
- AgentConfiguration: AI agent settings per cabinet (1:1 relationship)
- AgentLog: Central logs for AI agents and external integrations
"""

from sqlalchemy import Column, Text, Boolean, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import Optional, TYPE_CHECKING
from datetime import datetime
import uuid

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.cabinet import Cabinet


class AgentConfiguration(Base, TimestampMixin):
    """
    Agent Configuration - AI Agent settings per Cabinet.
    
    One-to-one relationship with Cabinet. Contains system prompts,
    tone settings, and welcome messages for the virtual assistant.
    """
    
    __tablename__ = "agent_configurations"
    
    # Primary Key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()")
    )
    
    # Foreign Key to Cabinet (1:1, unique)
    cabinet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        unique=True,
        nullable=False
    )
    
    # Configuration Fields
    agent_name: Mapped[Optional[str]] = mapped_column(
        Text,
        server_default=text("'Assistente Virtual'::text"),
        nullable=True
    )
    tone: Mapped[Optional[str]] = mapped_column(
        Text,
        server_default=text("'Empático e Acolhedor'::text"),
        nullable=True
    )
    welcome_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[Optional[bool]] = mapped_column(
        Boolean,
        server_default=text("true"),
        nullable=True
    )
    
    # System Prompts
    system_prompt: Mapped[Optional[str]] = mapped_column(
        Text,
        server_default=text(
            "'Você é um assistente virtual do gabinete do Vereador {{politician_name}}. "
            "Seu tom é {{tone}}. Hoje é {{current_date}}. "
            "Responda de forma curta e objetiva. "
            "Se não souber, diga que vai verificar com a equipe.'::text"
        ),
        nullable=True
    )
    copilot_system_prompt: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    # Relationships
    cabinet: Mapped["Cabinet"] = relationship(
        "Cabinet",
        back_populates="agent_configuration",
        lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<AgentConfiguration(id={self.id}, agent_name='{self.agent_name}', is_active={self.is_active})>"


class AgentLog(Base):
    """
    Agent Log - Central logs for AI Agents and External Integrations.
    
    Used for tracking agent actions and the CityHall Adapter
    (Protocolo Fantasma feature).
    """
    
    __tablename__ = "agent_logs"
    
    # Primary Key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()")
    )
    
    # Foreign Key to Cabinet
    cabinet_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True
    )
    
    # Log Fields
    agent_name: Mapped[str] = mapped_column(Text, nullable=False)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Payload & Response (JSONB)
    payload: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        server_default=text("'{}'::jsonb"),
        nullable=True
    )
    response_summary: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        server_default=text("'{}'::jsonb"),
        nullable=True
    )
    
    # Timestamp
    created_at: Mapped[Optional[datetime]] = mapped_column(
        server_default=text("now()"),
        nullable=True
    )
    
    # Relationships
    cabinet: Mapped[Optional["Cabinet"]] = relationship(
        "Cabinet",
        back_populates="agent_logs",
        lazy="selectin"
    )
    
    def __repr__(self) -> str:
        return f"<AgentLog(id={self.id}, agent_name='{self.agent_name}', action='{self.action}', status='{self.status}')>"

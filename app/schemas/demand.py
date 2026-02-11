"""
Pydantic Schemas for Demands.

Contains request/response DTOs for the Demand entity.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class SyncStatus(str, Enum):
    """Sync status with CityHall API."""
    PENDING = "pending"
    SYNCED = "synced"
    ERROR = "error"


class DemandBase(BaseModel):
    """Base schema with common fields."""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    beneficiary: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = Field(default="Pendente")
    priority: Optional[str] = Field(default="Média")
    obs: Optional[str] = None
    assigned_to: Optional[str] = None


class DemandCreate(DemandBase):
    """Schema for creating a new demand."""
    cabinet_id: UUID


class DemandUpdate(BaseModel):
    """Schema for updating an existing demand (all fields optional)."""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    beneficiary: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    obs: Optional[str] = None
    assigned_to: Optional[str] = None


class DemandCityHallSync(BaseModel):
    """Schema for CityHall synchronization payload."""
    external_id: Optional[str] = Field(
        None,
        description="External protocol ID from CityHall API"
    )
    sync_status: SyncStatus = Field(
        default=SyncStatus.PENDING,
        description="Sync status: pending, synced, error"
    )
    last_sync_error: Optional[str] = Field(
        None,
        description="Last synchronization error message"
    )


class DemandResponse(DemandBase):
    """Schema for demand response (read operations)."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int  # BigInt in DB
    cabinet_id: UUID
    created_by: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # CityHall Integration
    external_id: Optional[str] = None
    sync_status: Optional[str] = Field(default="pending")
    last_sync_error: Optional[str] = None


class DemandListResponse(BaseModel):
    """Schema for paginated demand list."""
    items: list[DemandResponse]
    total: int
    page: int = 1
    per_page: int = 20

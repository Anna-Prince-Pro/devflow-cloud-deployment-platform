"""Deployment schemas for request/response validation (Pydantic v2)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.datetime_utils import ensure_utc_datetime

# Allowed deployment statuses
ALLOWED_STATUSES = {"pending", "running", "failed", "succeeded"}

# Valid status transitions: current -> set of allowed next statuses
STATUS_TRANSITIONS: dict[str, set[str]] = {
    "pending":   {"running", "failed"},
    "running":   {"succeeded", "failed"},
    "succeeded": set(),   # terminal
    "failed":    {"pending"},  # allow retry
}


class DeploymentBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: str
    commit_sha: Optional[str] = Field(None, max_length=40)
    environment: Optional[str] = Field(None, max_length=100)

    @field_validator("project_id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if v is not None else v


class DeploymentCreate(DeploymentBase):
    """Payload for creating a new deployment.
    Status defaults to 'pending'; clients should not set status on creation.
    """
    pass


class DeploymentStatusUpdate(BaseModel):
    """Payload for PATCH /deployments/{id}/status."""
    status: Literal["pending", "running", "failed", "succeeded"]


class DeploymentRead(DeploymentBase):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime

    @field_validator("id", "project_id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if v is not None else v

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def validate_utc_datetime(cls, v):
        return ensure_utc_datetime(v)

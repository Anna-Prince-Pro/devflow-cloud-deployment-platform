"""Project schemas for request/response validation (Pydantic v2)."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProjectBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    repository_url: Optional[str] = Field(None, max_length=500)


class ProjectCreate(ProjectBase):
    """Payload for creating a new project.
    owner_id is NOT accepted from the client; it is determined exclusively
    by the backend from the authenticated JWT session.
    """
    pass


class ProjectRead(ProjectBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime

    @field_validator("id", "owner_id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if v is not None else v


class ProjectUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    repository_url: Optional[str] = Field(None, max_length=500)

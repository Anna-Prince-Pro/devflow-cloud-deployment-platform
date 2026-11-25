"""User schemas for request/response validation (Pydantic v2)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.datetime_utils import ensure_utc_datetime


class UserBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., max_length=150)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserRead(UserBase):
    id: str
    created_at: datetime

    @field_validator("id", mode="before")
    @classmethod
    def coerce_uuid(cls, v):
        return str(v) if v is not None else v

    @field_validator("created_at", mode="before")
    @classmethod
    def validate_utc_datetime(cls, v):
        return ensure_utc_datetime(v)


class UserLogin(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email: EmailStr
    password: str = Field(..., min_length=8)


class TokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    access_token: str
    token_type: str = "bearer"

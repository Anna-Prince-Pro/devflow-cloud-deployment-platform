from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship

from app.core.datetime_utils import utc_now
from app.models.base import Base, GUID, new_uuid


class User(Base):
    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=new_uuid, unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationship to projects
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")

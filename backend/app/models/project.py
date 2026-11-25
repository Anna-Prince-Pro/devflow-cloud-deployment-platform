from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.core.datetime_utils import utc_now
from app.models.base import Base, GUID, new_uuid


class Project(Base):
    __tablename__ = "projects"
    __table_args__ = (Index("ix_projects_owner_id", "owner_id"),)

    id = Column(GUID, primary_key=True, default=new_uuid, unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    repository_url = Column(String(500), nullable=True)
    owner_id = Column(GUID, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    owner = relationship("User", back_populates="projects")
    deployments = relationship("Deployment", back_populates="project", cascade="all, delete-orphan")

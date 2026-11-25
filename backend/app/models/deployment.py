from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from enum import Enum
from sqlalchemy.orm import relationship

from app.core.datetime_utils import utc_now
from app.models.base import Base, GUID, new_uuid

class DeploymentStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"

class Deployment(Base):
    __tablename__ = "deployments"
    __table_args__ = (Index("ix_deployments_project_id", "project_id"),)

    id = Column(GUID, primary_key=True, default=new_uuid, unique=True, nullable=False)
    project_id = Column(GUID, ForeignKey("projects.id"), nullable=False)
    status = Column(String(50), default=DeploymentStatus.PENDING.value, nullable=False)
    commit_sha = Column(String(40), nullable=True)
    environment = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    project = relationship("Project", back_populates="deployments")

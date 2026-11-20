"""Deployment service layer: CRUD operations using SQLAlchemy 2.0.

All functions accept a SQLAlchemy Session and return model instances or None.
Enforces strict project ownership, valid status transitions, and transaction rollback.
"""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.deployment import Deployment, DeploymentStatus
from app.models.project import Project
from app.schemas.deployment import STATUS_TRANSITIONS, DeploymentCreate


# ---------------------------------------------------------------------------
# Read helpers
# ---------------------------------------------------------------------------

def get_deployments(db: Session) -> list[Deployment]:
    """Return all Deployment records (admin query)."""
    return db.execute(select(Deployment)).scalars().all()


def get_deployment(db: Session, deployment_id: str) -> Deployment | None:
    """Return a single Deployment by its UUID string, or None if invalid/not found."""
    try:
        uid = UUID(str(deployment_id))
    except (ValueError, TypeError, AttributeError):
        return None
    return db.execute(select(Deployment).where(Deployment.id == uid)).scalar_one_or_none()


def get_deployments_by_project(db: Session, project_id: str) -> list[Deployment]:
    """Return deployments belonging to a given project UUID."""
    try:
        pid = UUID(str(project_id))
    except (ValueError, TypeError, AttributeError):
        return []
    return db.execute(select(Deployment).where(Deployment.project_id == pid)).scalars().all()


def get_deployments_for_user(db: Session, user_id: str) -> list[Deployment]:
    """Return all deployments whose project is owned by user_id."""
    try:
        uid = UUID(str(user_id))
    except (ValueError, TypeError, AttributeError):
        return []
    stmt = (
        select(Deployment)
        .join(Project, Deployment.project_id == Project.id)
        .where(Project.owner_id == uid)
    )
    return db.execute(stmt).scalars().all()


# ---------------------------------------------------------------------------
# Ownership validation helpers
# ---------------------------------------------------------------------------

def _assert_project_owned(db: Session, project_id: str, user_id: str) -> Project:
    """Raise 404 if project does not exist or is not owned by user_id.

    Returns the verified Project instance.
    """
    from app.services.project_service import get_project
    try:
        UUID(str(project_id))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    project = get_project(db, project_id)
    if not project or str(project.owner_id) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return project


# ---------------------------------------------------------------------------
# Write helpers
# ---------------------------------------------------------------------------

def create_deployment(db: Session, payload: DeploymentCreate, user_id: str) -> Deployment:
    """Create a Deployment linked to a project owned by user_id.

    - Validates project existence and ownership (404 if not found or unauthorized).
    - Status defaults to 'pending' (DeploymentStatus.PENDING).
    - Commits transaction; rolls back on error.
    """
    project = _assert_project_owned(db, payload.project_id, user_id)
    new_deployment = Deployment(
        project_id=project.id,
        status=DeploymentStatus.PENDING.value,
        commit_sha=payload.commit_sha,
        environment=payload.environment,
    )
    try:
        db.add(new_deployment)
        db.commit()
        db.refresh(new_deployment)
        return new_deployment
    except Exception:
        db.rollback()
        raise


def update_deployment_status(
    db: Session,
    deployment_id: str,
    new_status: str,
    user_id: str,
) -> Deployment:
    """Update a deployment's status.

    - Verifies the deployment exists and belongs to a project owned by user_id.
    - Validates the status transition according to the lifecycle state machine.
    - Commits transaction; rolls back on error.
    - Returns the updated Deployment.
    """
    deployment = get_deployment(db, deployment_id)
    if not deployment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found",
        )

    # Enforce ownership through the parent project
    _assert_project_owned(db, str(deployment.project_id), user_id)

    current = deployment.status
    allowed_next = STATUS_TRANSITIONS.get(current, set())
    if new_status not in allowed_next:
        allowed_desc = ", ".join(sorted(allowed_next)) if allowed_next else "none (terminal state)"
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Cannot transition from '{current}' to '{new_status}'. Allowed transitions: {allowed_desc}.",
        )

    try:
        deployment.status = new_status
        db.commit()
        db.refresh(deployment)
        return deployment
    except Exception:
        db.rollback()
        raise

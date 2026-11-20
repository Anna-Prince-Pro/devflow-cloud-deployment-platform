"""Project service layer: CRUD operations using SQLAlchemy Session.

Handles persistence, ownership assignment, UUID validation, and transaction rollbacks.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


def get_projects(db: Session, owner_id: str | None = None) -> list[Project]:
    """Return projects, optionally filtered by owner UUID."""
    stmt = select(Project)
    if owner_id is not None:
        try:
            uid = UUID(str(owner_id))
        except (ValueError, TypeError, AttributeError):
            return []
        stmt = stmt.where(Project.owner_id == uid)
    return db.execute(stmt).scalars().all()


def get_project(db: Session, project_id: str) -> Project | None:
    """Return a single project by UUID string or None if invalid/not found."""
    try:
        uid = UUID(str(project_id))
    except (ValueError, TypeError, AttributeError):
        return None
    stmt = select(Project).where(Project.id == uid)
    return db.execute(stmt).scalar_one_or_none()


def create_project(db: Session, payload: ProjectCreate, owner_id: str | UUID) -> Project:
    """Create and persist a Project instance belonging to the authenticated owner.

    Derives owner_id strictly from the authenticated user, never from client input.
    Rolls back on error and re-raises.
    """
    try:
        owner_uuid = UUID(str(owner_id))
    except (ValueError, TypeError, AttributeError):
        raise ValueError("Invalid owner_id UUID")

    new_project = Project(
        name=payload.name,
        description=payload.description,
        repository_url=payload.repository_url,
        owner_id=owner_uuid,
    )
    try:
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
        return new_project
    except Exception:
        db.rollback()
        raise


def update_project(db: Session, project_id: str, payload: ProjectUpdate) -> Project | None:
    """Update fields of an existing Project.

    Returns the updated Project or None if not found or invalid UUID.
    Rolls back on database error and re-raises.
    """
    try:
        uid = UUID(str(project_id))
    except (ValueError, TypeError, AttributeError):
        return None

    stmt = select(Project).where(Project.id == uid)
    project = db.execute(stmt).scalar_one_or_none()
    if not project:
        return None

    update_data = payload.model_dump(exclude_unset=True)
    for attr, value in update_data.items():
        setattr(project, attr, value)

    try:
        db.commit()
        db.refresh(project)
        return project
    except Exception:
        db.rollback()
        raise


def delete_project(db: Session, project_id: str) -> bool:
    """Delete a Project by id.

    Uses ORM deletion to honor cascade configurations (e.g. child deployments).
    Returns True if deleted, False if not found or invalid UUID.
    Rolls back on error and re-raises.
    """
    try:
        uid = UUID(str(project_id))
    except (ValueError, TypeError, AttributeError):
        return False

    stmt = select(Project).where(Project.id == uid)
    project = db.execute(stmt).scalar_one_or_none()
    if not project:
        return False

    try:
        db.delete(project)
        db.commit()
        return True
    except Exception:
        db.rollback()
        raise

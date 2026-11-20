"""Project endpoints — all routes require a valid JWT Bearer token.

Ensures strict user ownership: users can only view, create, update,
or delete their own projects.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.services.project_service import (
    get_projects,
    get_project,
    create_project,
    update_project,
    delete_project,
)
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=list[ProjectRead])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all projects owned by the authenticated user."""
    return get_projects(db, owner_id=str(current_user.id))


@router.post(
    "/",
    response_model=ProjectRead,
    status_code=status.HTTP_201_CREATED,
)
def create_new_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a project for the authenticated user.

    The owner is automatically set to the authenticated user's ID.
    """
    return create_project(db, payload, owner_id=current_user.id)


@router.get("/{project_id}", response_model=ProjectRead)
def read_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve a single project by ID. Returns 404 if not found or owned by another user."""
    proj = get_project(db, project_id)
    if not proj or str(proj.owner_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return proj


@router.put("/{project_id}", response_model=ProjectRead)
def update_existing(
    project_id: str,
    payload: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a project by ID. Returns 404 if not found or owned by another user."""
    proj = get_project(db, project_id)
    if not proj or str(proj.owner_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    updated = update_project(db, project_id, payload)
    return updated


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a project by ID. Returns 404 if not found or owned by another user."""
    proj = get_project(db, project_id)
    if not proj or str(proj.owner_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    if not delete_project(db, project_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return None

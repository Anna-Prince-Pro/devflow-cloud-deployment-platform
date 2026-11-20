"""Deployment endpoints — all routes require a valid JWT Bearer token.

Routes
------
GET    /                            List deployments owned (via projects) by the current user.
POST   /                            Create a new deployment under an owned project.
GET    /{deployment_id}             Retrieve a single deployment (must own the project).
PATCH  /{deployment_id}/status      Update deployment status with transition validation.
GET    /projects/{project_id}       List deployments for a specific owned project.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.deployment import DeploymentCreate, DeploymentRead, DeploymentStatusUpdate
from app.services.deployment_service import (
    get_deployment,
    get_deployments_by_project,
    get_deployments_for_user,
    create_deployment,
    update_deployment_status,
)
from app.services.project_service import get_project

router = APIRouter()


@router.get("/", response_model=list[DeploymentRead])
def list_deployments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all deployments belonging to projects owned by the current user."""
    return get_deployments_for_user(db, str(current_user.id))


@router.post("/", response_model=DeploymentRead, status_code=status.HTTP_201_CREATED)
def create_new_deployment(
    payload: DeploymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a deployment under a project owned by the current user."""
    return create_deployment(db, payload, str(current_user.id))


@router.get("/projects/{project_id}", response_model=list[DeploymentRead])
def list_deployments_by_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List deployments for a specific project (must be owned by current user)."""
    proj = get_project(db, project_id)
    if not proj or str(proj.owner_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return get_deployments_by_project(db, project_id)


@router.get("/{deployment_id}", response_model=DeploymentRead)
def read_deployment(
    deployment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve a single deployment (must belong to an owned project)."""
    dep = get_deployment(db, deployment_id)
    if not dep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found",
        )
    proj = get_project(db, str(dep.project_id))
    if not proj or str(proj.owner_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found",
        )
    return dep


@router.patch("/{deployment_id}/status", response_model=DeploymentRead)
def update_status(
    deployment_id: str,
    payload: DeploymentStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update the status of a deployment with transition validation."""
    return update_deployment_status(db, deployment_id, payload.status, str(current_user.id))

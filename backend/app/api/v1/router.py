from fastapi import APIRouter

from .endpoints import health, projects, deployments, users

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"], prefix="")
api_router.include_router(users.router, tags=["Users"], prefix="/users")
api_router.include_router(projects.router, tags=["Projects"], prefix="/projects")
api_router.include_router(deployments.router, tags=["Deployments"], prefix="/deployments")

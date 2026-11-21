from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME, version="0.1.0")
    # CORS
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # Include API router
    app.include_router(api_router, prefix="/api/v1")

    @app.get("/health", tags=["Health"])
    async def health() -> dict:
        return {"status": "ok"}

    @app.get("/ready", tags=["Health"], status_code=200)
    async def readiness() -> dict:
        from sqlalchemy import text
        from app.database.session import engine
        from fastapi import HTTPException
        try:
            # simple connection test using SQLAlchemy text
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return {"database": "ready"}
        except Exception:
            raise HTTPException(status_code=503, detail="Database unavailable")

    return app

app = create_app()

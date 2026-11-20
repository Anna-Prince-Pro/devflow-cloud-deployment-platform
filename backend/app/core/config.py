import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the repository root (four levels up from this file)
repo_root = Path(__file__).resolve().parents[3]
load_dotenv(repo_root / ".env")

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://devflow_user:devflow_password@localhost:5432/devflow_db",
    )
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me")
    APP_NAME: str = os.getenv("APP_NAME", "DevFlow API")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # Allowed origins for CORS (comma-separated in .env). Default to wildcard for development.
    ALLOWED_ORIGINS: list[str] = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",") if origin.strip()]


settings = Settings()
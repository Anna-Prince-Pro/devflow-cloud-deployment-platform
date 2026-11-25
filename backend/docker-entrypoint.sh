#!/bin/sh
set -e

echo "==> Running database migrations with Alembic..."
alembic upgrade head
echo "==> Database migrations applied successfully."

echo "==> Starting DevFlow FastAPI application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000

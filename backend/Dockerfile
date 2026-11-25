# =============================================================================
# DevFlow — Backend Dockerfile (FastAPI + Python 3.12)
# =============================================================================

FROM python:3.12-slim

# Set environment variables for Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install system dependencies (curl for container healthcheck)
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Install Python application dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

# Copy application source and Alembic migrations
COPY app /app/app
COPY alembic /app/alembic
COPY alembic.ini /app/alembic.ini
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

# Ensure proper execution permissions and line endings on entrypoint script
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && \
    chmod +x /app/docker-entrypoint.sh

# Expose backend port
EXPOSE 8000

# Healthcheck probe using the /health endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

# Entrypoint applies Alembic migrations and starts Uvicorn
ENTRYPOINT ["/app/docker-entrypoint.sh"]

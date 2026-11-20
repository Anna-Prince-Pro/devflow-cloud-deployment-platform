# DevFlow — Backend Service

The core REST API service for **DevFlow**, a Cloud-Native Deployment Management Platform. Built with FastAPI, SQLAlchemy 2.0, PostgreSQL 15, and Pydantic v2.

---

## 🏗️ Architecture

```mermaid
graph TD
    Client["🌐 Frontend / API Client"] -->|JWT Bearer Auth| FastAPI["⚡ FastAPI 0.115"]
    FastAPI --> Routers["🛣️ API Routers\n/api/v1"]
    Routers --> Dependencies["🔐 Dependencies\nget_current_user, get_db"]
    Routers --> Services["⚙️ Service Layer\nuser_service, project_service, deployment_service"]
    Services --> ORM["📦 SQLAlchemy 2.0 ORM Models\nUser, Project, Deployment"]
    ORM --> DB[("🐘 PostgreSQL 15 / SQLite Test")]
    Alembic["🔄 Alembic Migrations"] -.-> DB
```

### Key Design Principles

1. **Strict User Ownership**: All project and deployment operations are scoped to the authenticated user retrieved from the JWT token. No client-supplied owner IDs are trusted.
2. **Deterministic Lifecycle State Machine**: Deployments transition strictly through valid states (`pending` ➔ `running` ➔ `succeeded` or `failed`; retries from `failed` ➔ `pending`; `succeeded` is terminal). Invalid transitions are rejected with HTTP 422.
3. **Transaction Safety**: Every create, update, and delete operation is wrapped in try/except blocks with automatic `db.rollback()` on exceptions.
4. **Isolated Test Safety**: Tests never execute against the development database unless explicitly configured via `DEVFLOW_TEST_DATABASE_URL`.

---

## ⚙️ Environment Configuration

Configuration is loaded from `.env` in the repository root:

```bash
# Application
APP_NAME="DevFlow API"
APP_ENV="development"
SECRET_KEY="your-strong-random-secret-key"
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"

# Database (PostgreSQL)
DATABASE_URL="postgresql://devflow_user:devflow_password@localhost:5432/devflow_db"

# Dedicated Test Database (Used during pytest runs)
DEVFLOW_TEST_DATABASE_URL="sqlite:///./test_devflow.db"
```

---

## 🚀 Getting Started

### 1. Database Startup (Docker Compose)

From the project root:

```bash
docker compose up -d postgres
```

### 2. Database Migrations

Apply Alembic migrations to the latest revision:

```bash
# From backend/ directory
..\.venv\Scripts\alembic upgrade head
```

To create a new migration after model changes:

```bash
..\.venv\Scripts\alembic revision --autogenerate -m "describe_changes"
```

### 3. Start the Backend Server

```bash
# From backend/ directory
..\.venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Docs (Swagger UI): `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`

---

## 🔐 Authentication Guide

DevFlow uses OAuth2 Password Bearer authentication with JSON Web Tokens (HS256).

### 1. Register a New User

```http
POST /api/v1/users/register
Content-Type: application/json

{
  "name": "Alex Developer",
  "email": "alex@devflow.io",
  "password": "SecurePassword123"
}
```

Response: `HTTP 201 Created`

```json
{
  "id": "11111111-2222-3333-4444-555555555555",
  "name": "Alex Developer",
  "email": "alex@devflow.io",
  "created_at": "2026-11-20T12:00:00.000000"
}
```

### 2. Login to Obtain Access Token

```http
POST /api/v1/users/login
Content-Type: application/json

{
  "email": "alex@devflow.io",
  "password": "SecurePassword123"
}
```

Response: `HTTP 200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3. Authenticate Subsequent Requests

Add the Bearer token to the `Authorization` header:

```http
Authorization: Bearer <your_access_token>
```

---

## 📋 API Endpoints Overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | System health probe |
| `GET` | `/ready` | No | Database connection readiness probe |
| `POST` | `/api/v1/users/register` | No | Register a new user |
| `POST` | `/api/v1/users/login` | No | Authenticate user & get JWT |
| `GET` | `/api/v1/projects/` | **Yes** | List user's owned projects |
| `POST` | `/api/v1/projects/` | **Yes** | Create project (owner auto-assigned) |
| `GET` | `/api/v1/projects/{project_id}` | **Yes** | Get project details (404 if not owned) |
| `PUT` | `/api/v1/projects/{project_id}` | **Yes** | Update project (404 if not owned) |
| `DELETE` | `/api/v1/projects/{project_id}` | **Yes** | Delete project and cascade child deployments |
| `GET` | `/api/v1/deployments/` | **Yes** | List all deployments for user's projects |
| `POST` | `/api/v1/deployments/` | **Yes** | Create deployment under user's project |
| `GET` | `/api/v1/deployments/{id}` | **Yes** | Get deployment details (404 if not owned) |
| `PATCH` | `/api/v1/deployments/{id}/status` | **Yes** | Update deployment status (state machine checked) |
| `GET` | `/api/v1/deployments/projects/{id}` | **Yes** | List deployments for a specific project |

---

## 🧪 Automated Testing

### Safety Rules

- Tests will **never** touch the development PostgreSQL database by default.
- If `DEVFLOW_TEST_DATABASE_URL` is omitted, the test suite cleanly skips to prevent accidental data modification.

### Running Tests

To run the automated test suite with an isolated SQLite database:

```powershell
# In PowerShell (from backend/ directory):
$env:DEVFLOW_TEST_DATABASE_URL="sqlite:///./test_devflow.db"
..\.venv\Scripts\python.exe -m pytest tests -v
```

Or with a dedicated PostgreSQL test database:

```powershell
$env:DEVFLOW_TEST_DATABASE_URL="postgresql://devflow_user:devflow_password@localhost:5432/devflow_test_db"
..\.venv\Scripts\python.exe -m pytest tests -v
```

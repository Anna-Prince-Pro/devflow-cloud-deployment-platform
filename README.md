# DevFlow — Cloud-Native Deployment Management Platform

![Status](https://img.shields.io/badge/status-Foundation%20%7C%20Backend%20%7C%20Frontend%20Implemented-brightgreen)
![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)
![React](https://img.shields.io/badge/React-18-61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)

---

## 📋 Project Overview

**DevFlow** is a cloud-native deployment management platform that gives development teams a centralized dashboard to manage, monitor, and control application deployments across AWS infrastructure.

The platform automates the deployment pipeline from code commit to production, offering real-time visibility into deployment health, rollback capabilities, and infrastructure cost tracking — all from a single interface.

This project is built as a professional portfolio piece, developed incrementally across structured development sessions to demonstrate full-stack, cloud, and DevOps engineering skills.

---

## ❗ Problem Statement

Modern software teams face several deployment challenges:

- **Fragmented tooling** — teams juggle multiple dashboards: AWS Console, CI/CD logs, container registries, and monitoring tools with no unified view.
- **Deployment anxiety** — no easy way to compare what is running in production vs staging vs development at a glance.
- **Slow incident response** — identifying a bad deployment and triggering a rollback requires navigating multiple systems under pressure.
- **Infrastructure opacity** — developers rarely know the cost or resource impact of what they deploy.

DevFlow addresses these problems with a single, developer-friendly interface backed by automated infrastructure management.

---

## 🏗️ Architecture

```mermaid
graph TD
    Browser["🌐 Browser"] -->|HTTP| FE["⚛️ React Frontend\nVite + TypeScript\nlocalhost:5173"]
    FE -->|REST API /api/v1| BE["🐍 FastAPI Backend\nPython 3.12 + Uvicorn\nlocalhost:8000"]
    BE -->|SQLAlchemy ORM| DB["🐘 PostgreSQL 15\nDocker Compose\nlocalhost:5432"]
    BE -->|Alembic| MIG["📦 Database Migrations"]
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18 | UI component framework |
| TypeScript | 5 | Type-safe JavaScript |
| Vite | 5 | Fast build tooling |
| Tailwind CSS | 3 | Utility-first dark-theme styling |
| TanStack Query | 5 | Server state management |
| React Router | 6 | Client-side routing |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.12 | Primary language |
| FastAPI | 0.115 | Async REST API framework |
| SQLAlchemy | 2.0 | ORM / database abstraction |
| Alembic | 1.14 | Database migrations |
| Pydantic | 2.10 | Data validation and serialization |
| Uvicorn | 0.32 | ASGI production server |
| Ruff | 0.8 | Linter and formatter |
| pytest | 8.3 | Test framework |

### Database
| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 15 | Primary relational database (Docker Compose locally, RDS in production) |

### DevOps (Planned)
| Technology | Purpose |
|------------|---------|
| Docker / Docker Compose | Containerization and local orchestration |
| AWS ECS (Fargate) | Container hosting |
| AWS RDS | Managed PostgreSQL |
| AWS ALB | Load balancing |
| Terraform | Infrastructure-as-code |
| GitHub Actions | CI/CD automation |
| CloudWatch | Monitoring and alerting |

---

## 📁 Project Structure

```
devflow-cloud-deployment-platform/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app entrypoint
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py            # Pydantic Settings
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── router.py        # Aggregates all routers
│   │   │       └── endpoints/
│   │   │           ├── __init__.py
│   │   │           ├── health.py    # /health and /ready
│   │   │           ├── projects.py  # CRUD for projects
│   │   │           └── deployments.py # Read-only deployments
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── base.py              # Declarative base
│   │   │   ├── user.py              # User model
│   │   │   ├── project.py           # Project model
│   │   │   └── deployment.py        # Deployment model
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── project.py           # ProjectCreate / ProjectRead / ProjectList
│   │   │   └── deployment.py        # DeploymentRead / DeploymentList
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── project_service.py
│   │   │   └── deployment_service.py
│   │   └── database/
│   │       ├── __init__.py
│   │       └── session.py           # Engine, SessionLocal, get_db
│   ├── migrations/                  # Alembic migrations
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py              # SQLite in-memory fixtures
│   │   ├── test_health.py
│   │   ├── test_projects.py
│   │   └── test_deployments.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                     # TanStack Query hooks
│   │   ├── components/              # Shared UI components
│   │   ├── pages/                   # Route-level page components
│   │   └── main.tsx                 # App entrypoint
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── infrastructure/
│   ├── terraform/                   # AWS IaC (planned)
│   └── scripts/                     # Deployment utilities
├── docs/
│   └── architecture.md              # Detailed architecture docs
├── .github/
│   └── workflows/                   # GitHub Actions CI/CD (planned)
├── docker-compose.yml               # Local PostgreSQL via Docker
├── .env.example                     # Configuration template (safe to commit)
├── .gitignore
└── README.md
```

---

## ✅ Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.12+ | `python --version` |
| Node.js | 20+ | `node --version` |
| Docker Desktop | Latest | Required for PostgreSQL |
| Git | Any | `git --version` |

---

## 🚀 Local Development Setup

```bash
# 1. Clone
git clone https://github.com/Anna-Prince-Pro/devflow-cloud-deployment-platform.git
cd devflow-cloud-deployment-platform

# 2. Environment
cp .env.example .env
# Edit .env — set a real SECRET_KEY

# 3. Start PostgreSQL
docker compose up -d postgres

# 4. Backend
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt

# 5. Run migrations
alembic upgrade head

# 6. Start FastAPI
uvicorn app.main:app --reload --port 8000

# 7. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

The API will be available at **http://localhost:8000** (Swagger UI: http://localhost:8000/docs)  
The frontend will be available at **http://localhost:5173**

---

## ⚙️ Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://devflow_user:password@localhost:5432/devflow_db` |
| `SECRET_KEY` | App secret key (JWT signing) | Long random string |
| `APP_NAME` | Application display name | `DevFlow` |
| `APP_ENV` | Runtime environment | `development` |
| `ALLOWED_ORIGINS` | CORS allowed origins (JSON array) | `["http://localhost:5173"]` |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID | From GitHub Developer Settings |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret | From GitHub Developer Settings |
| `GITHUB_WEBHOOK_SECRET` | Secret for validating webhook payloads | Random string |
| `VITE_APP_API_URL` | Frontend API base URL | `http://localhost:8000` |

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Root — returns API name and version |
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/ready` | Readiness check (verifies DB connection) |
| `GET` | `/api/v1/projects` | List all projects |
| `POST` | `/api/v1/projects` | Create a new project |
| `GET` | `/api/v1/projects/{id}` | Get a project by ID |
| `GET` | `/api/v1/deployments` | List all deployments |
| `GET` | `/api/v1/deployments/{id}` | Get a deployment by ID |

Full interactive docs available at **http://localhost:8000/docs** when running locally.

---

## 🧪 Testing

```bash
# Backend tests (from repo root)
cd backend
.venv\Scripts\pytest tests/ -v        # Windows
# or
.venv/bin/pytest tests/ -v            # macOS/Linux

# Frontend tests
cd frontend
npm test

# Backend linting
cd backend
.venv\Scripts\ruff check app/         # Windows
# or
.venv/bin/ruff check app/             # macOS/Linux
```

---

## 📊 Implementation Status

| Feature | Status |
|---------|--------|
| Project structure and Git repository | ✅ Complete |
| FastAPI backend with health, projects, deployments endpoints | ✅ Complete |
| SQLAlchemy models (User, Project, Deployment) | ✅ Complete |
| Alembic migration configuration | ✅ Complete |
| Pydantic request/response schemas | ✅ Complete |
| React + TypeScript frontend | ✅ Complete |
| Tailwind CSS dark theme | ✅ Complete |
| React Router navigation | ✅ Complete |
| TanStack Query API integration | ✅ Complete |
| Project registration form | ✅ Complete |
| Backend test suite (pytest) | ✅ Complete |
| Frontend test suite (Vitest) | ✅ Complete |
| Alembic migration run (requires Docker + PostgreSQL) | 🔜 Pending Docker |
| GitHub OAuth authentication | 📋 Planned |
| Docker image builds | 📋 Planned |
| AWS ECS deployment | 📋 Planned |
| Terraform infrastructure | 📋 Planned |
| GitHub Actions CI/CD | 📋 Planned |
| Deployment monitoring (CloudWatch) | 📋 Planned |
| Rollback support | 📋 Planned |

---

## 📄 License

This project is for educational and portfolio purposes.

---

*Last updated: Sprint 2 — Foundation + Backend + Frontend implemented*

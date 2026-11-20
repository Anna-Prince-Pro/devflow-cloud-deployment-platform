"""Pytest configuration and fixtures for DevFlow backend automated tests.

Safety Policy:
- Never executes destructive tests against the development database.
- Requires `DEVFLOW_TEST_DATABASE_URL` environment variable to be explicitly configured.
- If `DEVFLOW_TEST_DATABASE_URL` is missing, tests are skipped with instructions.
- All test data is completely isolated and cleaned up between test cases.
"""

import os
import pytest
from fastapi.testclient import TestClient
from passlib.context import CryptContext
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Speed up bcrypt for automated tests (4 rounds instead of 12) to keep test suite fast
import app.services.user_service as user_service
user_service.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=4)

# Import all models to ensure Base.metadata contains all tables
from app.models.base import Base
import app.models.user
import app.models.project
import app.models.deployment
from app.database.session import get_db
from app.main import app


@pytest.fixture(scope="session")
def test_db_engine():
    """Create and initialize the test database engine.

    Requires DEVFLOW_TEST_DATABASE_URL. Skips test execution if not provided.
    """
    test_db_url = os.getenv("DEVFLOW_TEST_DATABASE_URL")
    if not test_db_url:
        pytest.skip(
            "DEVFLOW_TEST_DATABASE_URL is not set. A dedicated test database is required "
            "to prevent accidental modification of the development database. "
            "Set DEVFLOW_TEST_DATABASE_URL (e.g. 'sqlite:///./test_devflow.db' or "
            "'postgresql://devflow_user:devflow_password@localhost:5432/devflow_test_db') "
            "before executing tests."
        )

    connect_args = {}
    poolclass = None
    if test_db_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
        if test_db_url == "sqlite://" or ":memory:" in test_db_url:
            poolclass = StaticPool

    engine_kwargs = {"connect_args": connect_args}
    if poolclass:
        engine_kwargs["poolclass"] = poolclass

    engine = create_engine(test_db_url, **engine_kwargs)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def db_session(test_db_engine):
    """Provide a clean database session per test and clean up tables afterwards."""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_db_engine)
    session = SessionLocal()
    yield session
    session.close()

    # Clean up all records after each test
    from app.models.deployment import Deployment
    from app.models.project import Project
    from app.models.user import User

    with test_db_engine.begin() as conn:
        conn.execute(Deployment.__table__.delete())
        conn.execute(Project.__table__.delete())
        conn.execute(User.__table__.delete())


@pytest.fixture()
def client(db_session):
    """FastAPI TestClient wired to the test database session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Test authentication helpers and fixtures
# ---------------------------------------------------------------------------

USER_ALICE = {
    "name": "Alice Developer",
    "email": "alice@devflow.io",
    "password": "Password123!",
}

USER_BOB = {
    "name": "Bob DevOps",
    "email": "bob@devflow.io",
    "password": "Password456!",
}


def register_and_login(client: TestClient, user_data: dict) -> dict:
    """Helper to register and login a user, returning Bearer headers."""
    client.post("/api/v1/users/register", json=user_data)
    login_resp = client.post(
        "/api/v1/users/login",
        json={"email": user_data["email"], "password": user_data["password"]},
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def alice_auth(client) -> dict:
    return register_and_login(client, USER_ALICE)


@pytest.fixture()
def bob_auth(client) -> dict:
    return register_and_login(client, USER_BOB)


@pytest.fixture()
def alice_project(client, alice_auth) -> dict:
    """Fixture that creates a project owned by Alice."""
    resp = client.post(
        "/api/v1/projects/",
        json={
            "name": "Alice Microservice",
            "description": "Deployment microservice",
            "repository_url": "https://github.com/alice/microservice",
        },
        headers=alice_auth,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()

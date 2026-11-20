"""Automated tests for user registration, authentication, and JWT handling."""

from datetime import timedelta
import pytest
from app.core.security import create_access_token


class TestUserRegistration:
    def test_successful_registration(self, client):
        """1. Successful registration returns 201 with public user details."""
        resp = client.post(
            "/api/v1/users/register",
            json={"name": "Charlie", "email": "charlie@devflow.io", "password": "SecurePassword123"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "charlie@devflow.io"
        assert data["name"] == "Charlie"
        assert "id" in data
        assert "password" not in data
        assert "password_hash" not in data

    def test_duplicate_email_registration(self, client):
        """2. Registering with an existing email returns 409 Conflict."""
        payload = {"name": "Dana", "email": "dana@devflow.io", "password": "SecurePassword123"}
        first_resp = client.post("/api/v1/users/register", json=payload)
        assert first_resp.status_code == 201

        duplicate_resp = client.post("/api/v1/users/register", json=payload)
        assert duplicate_resp.status_code == 409
        assert "already registered" in duplicate_resp.json()["detail"].lower()

    def test_invalid_email_format(self, client):
        """Pydantic rejects invalid email formats with 422."""
        resp = client.post(
            "/api/v1/users/register",
            json={"name": "Invalid", "email": "not-an-email", "password": "SecurePassword123"},
        )
        assert resp.status_code == 422

    def test_short_password_rejected(self, client):
        """Pydantic rejects passwords shorter than 8 characters."""
        resp = client.post(
            "/api/v1/users/register",
            json={"name": "Short", "email": "short@devflow.io", "password": "short"},
        )
        assert resp.status_code == 422


class TestUserLogin:
    def test_successful_login(self, client):
        """3. Successful login returns HTTP 200 with JWT access token."""
        client.post(
            "/api/v1/users/register",
            json={"name": "Evan", "email": "evan@devflow.io", "password": "SecurePassword123"},
        )
        login_resp = client.post(
            "/api/v1/users/login",
            json={"email": "evan@devflow.io", "password": "SecurePassword123"},
        )
        assert login_resp.status_code == 200
        data = login_resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 20

    def test_invalid_login_credentials(self, client):
        """4. Invalid credentials return HTTP 401 Unauthorized."""
        client.post(
            "/api/v1/users/register",
            json={"name": "Fiona", "email": "fiona@devflow.io", "password": "SecurePassword123"},
        )
        # Wrong password
        resp = client.post(
            "/api/v1/users/login",
            json={"email": "fiona@devflow.io", "password": "WrongPassword!"},
        )
        assert resp.status_code == 401

        # Nonexistent email
        resp_nonexistent = client.post(
            "/api/v1/users/login",
            json={"email": "unknown@devflow.io", "password": "SecurePassword123"},
        )
        assert resp_nonexistent.status_code == 401


class TestJWTProtection:
    def test_jwt_protected_endpoints_reject_unauthenticated(self, client):
        """5. Accessing protected endpoints without a token returns HTTP 401."""
        # Projects endpoint
        assert client.get("/api/v1/projects/").status_code == 401
        assert client.post("/api/v1/projects/", json={"name": "Test"}).status_code == 401
        # Deployments endpoint
        assert client.get("/api/v1/deployments/").status_code == 401
        assert client.post("/api/v1/deployments/", json={"project_id": "123"}).status_code == 401

    def test_invalid_or_expired_jwt_handling(self, client):
        """18. Invalid, forged, or expired JWTs return HTTP 401."""
        # Malformed / forged token
        bad_headers = {"Authorization": "Bearer not-a-valid-jwt-token"}
        resp = client.get("/api/v1/projects/", headers=bad_headers)
        assert resp.status_code == 401

        # Expired token
        expired_token = create_access_token(
            {"sub": "00000000-0000-0000-0000-000000000001"},
            expires_delta=timedelta(seconds=-10),
        )
        expired_headers = {"Authorization": f"Bearer {expired_token}"}
        resp_expired = client.get("/api/v1/projects/", headers=expired_headers)
        assert resp_expired.status_code == 401

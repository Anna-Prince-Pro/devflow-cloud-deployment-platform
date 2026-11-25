"""Automated tests for timezone handling and UTC consistency across DevFlow."""

from datetime import datetime, timezone, timedelta
import pytest
from app.core.datetime_utils import utc_now, ensure_utc_datetime
from app.schemas.user import UserRead
from app.schemas.project import ProjectRead
from app.schemas.deployment import DeploymentRead


class TestTimezoneUtilities:
    def test_utc_now_returns_timezone_aware_utc(self):
        """utc_now() must return a timezone-aware datetime with timezone.utc."""
        now = utc_now()
        assert now.tzinfo is not None
        assert now.tzinfo == timezone.utc

    def test_ensure_utc_datetime_with_naive_datetime(self):
        """Naive datetimes (e.g. from DB) must be tagged as UTC without shifting hours."""
        naive = datetime(2026, 11, 22, 5, 37, 34, 500000)
        aware = ensure_utc_datetime(naive)
        assert aware.tzinfo == timezone.utc
        assert aware.year == 2026
        assert aware.month == 11
        assert aware.day == 22
        assert aware.hour == 5
        assert aware.minute == 37
        assert aware.second == 34

    def test_ensure_utc_datetime_with_aware_utc_datetime(self):
        """Already aware UTC datetime should be preserved."""
        original = datetime(2026, 11, 22, 5, 37, 34, tzinfo=timezone.utc)
        result = ensure_utc_datetime(original)
        assert result.tzinfo == timezone.utc
        assert result == original

    def test_ensure_utc_datetime_with_non_utc_offset(self):
        """Datetime with non-UTC offset (e.g. IST +05:30) must be converted to UTC."""
        ist = timezone(timedelta(hours=5, minutes=30))
        ist_dt = datetime(2026, 11, 22, 11, 7, 34, tzinfo=ist)
        utc_dt = ensure_utc_datetime(ist_dt)
        assert utc_dt.tzinfo == timezone.utc
        assert utc_dt.hour == 5
        assert utc_dt.minute == 37

    def test_ensure_utc_datetime_with_naive_string(self):
        """ISO string without timezone suffix must be safely interpreted as UTC."""
        naive_str = "2026-11-22T05:37:34.123456"
        res = ensure_utc_datetime(naive_str)
        assert res.tzinfo == timezone.utc
        assert res.hour == 5
        assert res.minute == 37

    def test_ensure_utc_datetime_with_z_string(self):
        """ISO string with Z suffix must be parsed as UTC."""
        z_str = "2026-11-22T05:37:34.123456Z"
        res = ensure_utc_datetime(z_str)
        assert res.tzinfo == timezone.utc
        assert res.hour == 5
        assert res.minute == 37

    def test_ensure_utc_datetime_with_offset_string(self):
        """ISO string with explicit offset must be converted to UTC."""
        offset_str = "2026-11-22T11:07:34.123456+05:30"
        res = ensure_utc_datetime(offset_str)
        assert res.tzinfo == timezone.utc
        assert res.hour == 5
        assert res.minute == 37


class TestSchemaSerializationUTC:
    def test_user_read_emits_utc_iso_string(self):
        """UserRead schema must emit UTC ISO timestamp ending with Z."""
        naive_dt = datetime(2026, 11, 22, 5, 37, 34)
        user_read = UserRead(
            id="a1b2c3d4-e5f6-7890-1234-567890abcdef",
            name="Alice",
            email="alice@devflow.io",
            created_at=naive_dt,
        )
        json_data = user_read.model_dump(mode="json")
        assert json_data["created_at"].endswith("Z") or "+00:00" in json_data["created_at"]
        assert "2026-11-22T05:37:34" in json_data["created_at"]

    def test_project_read_emits_utc_iso_strings(self):
        """ProjectRead schema must emit UTC ISO timestamps ending with Z."""
        naive_dt = datetime(2026, 11, 22, 5, 37, 34)
        proj_read = ProjectRead(
            id="b2c3d4e5-f6a7-8901-2345-67890abcdef1",
            owner_id="a1b2c3d4-e5f6-7890-1234-567890abcdef",
            name="Test Project",
            created_at=naive_dt,
            updated_at=naive_dt,
        )
        json_data = proj_read.model_dump(mode="json")
        assert json_data["created_at"].endswith("Z") or "+00:00" in json_data["created_at"]
        assert json_data["updated_at"].endswith("Z") or "+00:00" in json_data["updated_at"]

    def test_deployment_read_emits_utc_iso_strings(self):
        """DeploymentRead schema must emit UTC ISO timestamps ending with Z."""
        naive_dt = datetime(2026, 11, 22, 5, 37, 34)
        dep_read = DeploymentRead(
            id="c3d4e5f6-a7b8-9012-3456-7890abcdef12",
            project_id="b2c3d4e5-f6a7-8901-2345-67890abcdef1",
            status="pending",
            created_at=naive_dt,
            updated_at=naive_dt,
        )
        json_data = dep_read.model_dump(mode="json")
        assert json_data["created_at"].endswith("Z") or "+00:00" in json_data["created_at"]
        assert json_data["updated_at"].endswith("Z") or "+00:00" in json_data["updated_at"]


class TestAPIEndpointsUTCResponse:
    def test_api_deployment_response_contains_z_timestamp(self, client, alice_auth, alice_project):
        """Deployments API must return timestamps with explicit UTC timezone designator."""
        resp = client.post(
            "/api/v1/deployments/",
            json={"project_id": alice_project["id"], "environment": "production"},
            headers=alice_auth,
        )
        assert resp.status_code == 201
        data = resp.json()
        assert "created_at" in data
        assert "updated_at" in data
        assert data["created_at"].endswith("Z") or "+00:00" in data["created_at"]
        assert data["updated_at"].endswith("Z") or "+00:00" in data["updated_at"]

"""Automated tests for deployment workflows, status transitions, and user ownership enforcement."""

import pytest


class TestDeploymentWorkflows:
    def test_deployment_creation(self, client, alice_auth, alice_project):
        """11. Deployment creation succeeds under an owned project with default 'pending' status."""
        payload = {
            "project_id": alice_project["id"],
            "commit_sha": "7b8e5c2d3f1a4e6b9c8d7e6f5a4b3c2d1e0f9a8b",
            "environment": "production",
        }
        resp = client.post("/api/v1/deployments/", json=payload, headers=alice_auth)
        assert resp.status_code == 201
        data = resp.json()
        assert data["project_id"] == alice_project["id"]
        assert data["status"] == "pending"
        assert data["commit_sha"] == payload["commit_sha"]
        assert data["environment"] == payload["environment"]
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_deployment_listing(self, client, alice_auth, alice_project):
        """12. Deployment listing returns deployments belonging to the user's projects."""
        client.post(
            "/api/v1/deployments/",
            json={"project_id": alice_project["id"], "environment": "staging"},
            headers=alice_auth,
        )
        client.post(
            "/api/v1/deployments/",
            json={"project_id": alice_project["id"], "environment": "production"},
            headers=alice_auth,
        )

        resp = client.get("/api/v1/deployments/", headers=alice_auth)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 2
        for dep in data:
            assert dep["project_id"] == alice_project["id"]

    def test_deployment_retrieval(self, client, alice_auth, alice_project):
        """13. Deployment retrieval returns deployment details by ID."""
        dep = client.post(
            "/api/v1/deployments/",
            json={"project_id": alice_project["id"], "environment": "production"},
            headers=alice_auth,
        ).json()

        resp = client.get(f"/api/v1/deployments/{dep['id']}", headers=alice_auth)
        assert resp.status_code == 200
        assert resp.json()["id"] == dep["id"]
        assert resp.json()["status"] == "pending"

    def test_project_specific_deployment_listing(self, client, alice_auth, alice_project):
        """Deployments can be listed specifically by project ID."""
        client.post(
            "/api/v1/deployments/",
            json={"project_id": alice_project["id"], "environment": "dev"},
            headers=alice_auth,
        )
        resp = client.get(f"/api/v1/deployments/projects/{alice_project['id']}", headers=alice_auth)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1


class TestDeploymentStatusTransitions:
    def test_valid_status_transitions(self, client, alice_auth, alice_project):
        """14. Status updates follow allowed transitions: pending -> running -> succeeded."""
        dep = client.post(
            "/api/v1/deployments/",
            json={"project_id": alice_project["id"]},
            headers=alice_auth,
        ).json()
        assert dep["status"] == "pending"

        # Transition: pending -> running
        r1 = client.patch(
            f"/api/v1/deployments/{dep['id']}/status",
            json={"status": "running"},
            headers=alice_auth,
        )
        assert r1.status_code == 200
        assert r1.json()["status"] == "running"

        # Transition: running -> succeeded
        r2 = client.patch(
            f"/api/v1/deployments/{dep['id']}/status",
            json={"status": "succeeded"},
            headers=alice_auth,
        )
        assert r2.status_code == 200
        assert r2.json()["status"] == "succeeded"

    def test_failure_and_retry_transitions(self, client, alice_auth, alice_project):
        """Allows running -> failed and failed -> pending (retry)."""
        dep = client.post(
            "/api/v1/deployments/",
            json={"project_id": alice_project["id"]},
            headers=alice_auth,
        ).json()

        # pending -> running -> failed
        client.patch(f"/api/v1/deployments/{dep['id']}/status", json={"status": "running"}, headers=alice_auth)
        r_fail = client.patch(f"/api/v1/deployments/{dep['id']}/status", json={"status": "failed"}, headers=alice_auth)
        assert r_fail.status_code == 200
        assert r_fail.json()["status"] == "failed"

        # failed -> pending (retry allowed)
        r_retry = client.patch(f"/api/v1/deployments/{dep['id']}/status", json={"status": "pending"}, headers=alice_auth)
        assert r_retry.status_code == 200
        assert r_retry.json()["status"] == "pending"

    def test_invalid_deployment_status_transitions(self, client, alice_auth, alice_project):
        """15. Invalid transitions return HTTP 422 Unprocessable Entity."""
        dep = client.post(
            "/api/v1/deployments/",
            json={"project_id": alice_project["id"]},
            headers=alice_auth,
        ).json()

        # Cannot jump from pending directly to succeeded
        r_invalid = client.patch(
            f"/api/v1/deployments/{dep['id']}/status",
            json={"status": "succeeded"},
            headers=alice_auth,
        )
        assert r_invalid.status_code == 422
        assert "cannot transition" in r_invalid.json()["detail"].lower()

        # Transition to running, then succeeded
        client.patch(f"/api/v1/deployments/{dep['id']}/status", json={"status": "running"}, headers=alice_auth)
        client.patch(f"/api/v1/deployments/{dep['id']}/status", json={"status": "succeeded"}, headers=alice_auth)

        # succeeded is terminal; cannot transition out of succeeded
        r_terminal = client.patch(
            f"/api/v1/deployments/{dep['id']}/status",
            json={"status": "running"},
            headers=alice_auth,
        )
        assert r_terminal.status_code == 422


class TestCrossUserDeploymentIsolation:
    def test_cross_user_deployment_access_prevention(self, client, alice_auth, bob_auth, alice_project):
        """17. Cross-user isolation: Bob cannot create, view, or update Alice's deployments (HTTP 404)."""
        # Bob cannot create a deployment on Alice's project
        create_resp = client.post(
            "/api/v1/deployments/",
            json={"project_id": alice_project["id"], "environment": "production"},
            headers=bob_auth,
        )
        assert create_resp.status_code == 404

        # Alice creates a deployment
        alice_dep = client.post(
            "/api/v1/deployments/",
            json={"project_id": alice_project["id"], "environment": "production"},
            headers=alice_auth,
        ).json()

        # Bob cannot read Alice's deployment
        read_resp = client.get(f"/api/v1/deployments/{alice_dep['id']}", headers=bob_auth)
        assert read_resp.status_code == 404

        # Bob cannot update Alice's deployment status
        update_resp = client.patch(
            f"/api/v1/deployments/{alice_dep['id']}/status",
            json={"status": "running"},
            headers=bob_auth,
        )
        assert update_resp.status_code == 404

        # Bob cannot list deployments by Alice's project ID
        list_proj_resp = client.get(
            f"/api/v1/deployments/projects/{alice_project['id']}",
            headers=bob_auth,
        )
        assert list_proj_resp.status_code == 404

        # Bob's general deployment list does NOT include Alice's deployment
        bob_list = client.get("/api/v1/deployments/", headers=bob_auth).json()
        bob_dep_ids = [d["id"] for d in bob_list]
        assert alice_dep["id"] not in bob_dep_ids

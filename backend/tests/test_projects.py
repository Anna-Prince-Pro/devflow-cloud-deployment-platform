"""Automated tests for project CRUD, automatic ownership derivation, and cross-user isolation."""

import pytest


class TestProjectManagement:
    def test_project_creation_automatic_ownership(self, client, alice_auth):
        """6. Project creation derives ownership from JWT token without client owner_id."""
        payload = {
            "name": "Cloud API Gateway",
            "description": "API Gateway deployment",
            "repository_url": "https://github.com/org/gateway",
        }
        resp = client.post("/api/v1/projects/", json=payload, headers=alice_auth)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == payload["name"]
        assert data["description"] == payload["description"]
        assert data["repository_url"] == payload["repository_url"]
        assert "id" in data
        assert "owner_id" in data
        # Owner ID is populated automatically by backend
        assert len(data["owner_id"]) > 10

    def test_project_creation_ignores_client_owner_id_tampering(self, client, alice_auth, bob_auth):
        """Client-provided owner_id is never trusted; ownership is tied strictly to the token."""
        # Alice creates project 1
        r_alice = client.post(
            "/api/v1/projects/",
            json={"name": "Alice App", "description": "Alice's service"},
            headers=alice_auth,
        )
        # Bob creates project 2
        r_bob = client.post(
            "/api/v1/projects/",
            json={"name": "Bob App", "description": "Bob's service"},
            headers=bob_auth,
        )
        assert r_alice.status_code == 201
        assert r_bob.status_code == 201
        assert r_alice.json()["owner_id"] != r_bob.json()["owner_id"]

    def test_project_listing_isolated_to_owner(self, client, alice_auth, bob_auth):
        """7. Project listing returns only projects owned by the authenticated user."""
        # Create Alice project
        p_alice = client.post(
            "/api/v1/projects/",
            json={"name": "Alice Project A"},
            headers=alice_auth,
        ).json()

        # Create Bob project
        p_bob = client.post(
            "/api/v1/projects/",
            json={"name": "Bob Project B"},
            headers=bob_auth,
        ).json()

        # Alice list
        alice_list = client.get("/api/v1/projects/", headers=alice_auth).json()
        alice_ids = [p["id"] for p in alice_list]
        assert p_alice["id"] in alice_ids
        assert p_bob["id"] not in alice_ids

        # Bob list
        bob_list = client.get("/api/v1/projects/", headers=bob_auth).json()
        bob_ids = [p["id"] for p in bob_list]
        assert p_bob["id"] in bob_ids
        assert p_alice["id"] not in bob_ids

    def test_project_retrieval(self, client, alice_auth, alice_project):
        """8. Successfully retrieves a project owned by the user."""
        resp = client.get(f"/api/v1/projects/{alice_project['id']}", headers=alice_auth)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == alice_project["id"]
        assert data["name"] == alice_project["name"]

    def test_project_update(self, client, alice_auth, alice_project):
        """9. Project update modifies fields and returns updated resource."""
        update_payload = {
            "name": "Updated Microservice Name",
            "description": "Updated description",
        }
        resp = client.put(
            f"/api/v1/projects/{alice_project['id']}",
            json=update_payload,
            headers=alice_auth,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Updated Microservice Name"
        assert data["description"] == "Updated description"

    def test_project_deletion(self, client, alice_auth):
        """10. Project deletion removes the project and subsequent lookups return 404."""
        new_proj = client.post(
            "/api/v1/projects/",
            json={"name": "To Be Deleted"},
            headers=alice_auth,
        ).json()

        del_resp = client.delete(f"/api/v1/projects/{new_proj['id']}", headers=alice_auth)
        assert del_resp.status_code == 204

        # Verify project is gone
        get_resp = client.get(f"/api/v1/projects/{new_proj['id']}", headers=alice_auth)
        assert get_resp.status_code == 404


class TestCrossUserProjectIsolation:
    def test_cross_user_project_access_prevention(self, client, alice_auth, bob_auth, alice_project):
        """16. Cross-user isolation: Bob cannot view, update, or delete Alice's project (returns 404)."""
        project_id = alice_project["id"]

        # Bob cannot read Alice's project
        read_resp = client.get(f"/api/v1/projects/{project_id}", headers=bob_auth)
        assert read_resp.status_code == 404

        # Bob cannot update Alice's project
        update_resp = client.put(
            f"/api/v1/projects/{project_id}",
            json={"name": "Hijacked Project"},
            headers=bob_auth,
        )
        assert update_resp.status_code == 404

        # Bob cannot delete Alice's project
        delete_resp = client.delete(f"/api/v1/projects/{project_id}", headers=bob_auth)
        assert delete_resp.status_code == 404

        # Confirm Alice's project is still untouched
        verify_resp = client.get(f"/api/v1/projects/{project_id}", headers=alice_auth)
        assert verify_resp.status_code == 200
        assert verify_resp.json()["name"] == alice_project["name"]

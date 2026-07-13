"""Tests for GET /api/me/biases (the caller's own bias progress)."""
import json
import pytest
from .conftest import seed_defaults, TEST_UID


def test_get_biases_empty(client):
    r = client.get("/api/me/biases")
    assert r.status_code == 200
    data = r.json()
    assert "biases" in data
    assert len(data["biases"]) == 10
    # All incomplete
    for b in data["biases"]:
        assert b["completed"] is False
        assert b["attemptId"] is None
        assert b["level"] is None


def test_get_biases_requires_auth(anon_client):
    r = anon_client.get("/api/me/biases")
    assert r.status_code == 401


def test_get_biases_completed_shows_up(client, db):
    # The attempt FK-references a users row, so ensure the profile exists first.
    db.execute("INSERT INTO users (auth_user_id, role) VALUES (?, 'entrepreneur')", (TEST_UID,))
    # Manually insert a completed attempt for the authenticated user
    db.execute(
        "INSERT INTO bias_attempts (user_id, bias, completed_at, level) VALUES (?, ?, datetime('now'), ?)",
        (TEST_UID, "Confirmation Bias", "Low"),
    )
    db.commit()

    r = client.get("/api/me/biases")
    assert r.status_code == 200
    biases = r.json()["biases"]
    cb = next(b for b in biases if b["name"] == "Confirmation Bias")
    assert cb["completed"] is True
    assert cb["level"] == "Low"
    assert cb["attemptId"] is not None

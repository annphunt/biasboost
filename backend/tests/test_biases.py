"""Tests for GET /api/users/{userId}/biases."""
import json
import pytest
from .conftest import make_user, seed_defaults


def test_get_biases_empty(client):
    make_user(client, 200)
    r = client.get("/api/users/200/biases")
    assert r.status_code == 200
    data = r.json()
    assert "biases" in data
    assert len(data["biases"]) == 10
    # All incomplete
    for b in data["biases"]:
        assert b["completed"] is False
        assert b["attemptId"] is None
        assert b["level"] is None


def test_get_biases_invalid_user(client):
    r = client.get("/api/users/0/biases")
    assert r.status_code == 400


def test_get_biases_completed_shows_up(client, db):
    make_user(client, 201)
    # Manually insert a completed attempt
    db.execute(
        "INSERT INTO bias_attempts (user_id, bias, completed_at, level) VALUES (?, ?, datetime('now'), ?)",
        (201, "Confirmation Bias", "Low"),
    )
    db.commit()

    r = client.get("/api/users/201/biases")
    assert r.status_code == 200
    biases = r.json()["biases"]
    cb = next(b for b in biases if b["name"] == "Confirmation Bias")
    assert cb["completed"] is True
    assert cb["level"] == "Low"
    assert cb["attemptId"] is not None

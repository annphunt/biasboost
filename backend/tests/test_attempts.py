"""Tests for POST /api/attempts and GET /api/attempts/{id}.

The caller is identified by the auth session (overridden to TEST_UID in the
`client` fixture), so requests no longer pass a userId.
"""
import json
from unittest.mock import MagicMock, patch
import pytest
from .conftest import seed_defaults, MOCK_CLAUDE_QUESTIONS, TEST_UID


# ── POST /api/attempts ──────────────────────────────────────────────────────

def test_create_attempt_with_defaults(client, db):
    seed_defaults(db, "Confirmation Bias")

    r = client.post("/api/attempts", json={"bias": "Confirmation Bias"})
    assert r.status_code == 200
    assert "attemptId" in r.json()


def test_create_attempt_uses_defaults_not_claude(client, db):
    """When default questions exist, Claude should NOT be called."""
    seed_defaults(db, "Anchoring Bias")

    with patch("backend.main.get_anthropic") as mock_anthropic:
        r = client.post("/api/attempts", json={"bias": "Anchoring Bias"})
        mock_anthropic.assert_not_called()

    assert r.status_code == 200


def test_create_attempt_falls_back_to_claude(client, db):
    """With no defaults, Claude is called to generate questions."""
    mock_message = MagicMock()
    mock_message.content = [MagicMock(text=json.dumps(MOCK_CLAUDE_QUESTIONS))]

    with patch("backend.main.get_anthropic") as mock_factory:
        mock_factory.return_value.messages.create.return_value = mock_message
        r = client.post("/api/attempts", json={"bias": "Loss Aversion"})

    assert r.status_code == 200
    assert "attemptId" in r.json()


def test_create_attempt_resumes_incomplete(client, db):
    """A second call for the same user/bias returns existing attemptId."""
    seed_defaults(db, "Halo Effect")

    r1 = client.post("/api/attempts", json={"bias": "Halo Effect"})
    r2 = client.post("/api/attempts", json={"bias": "Halo Effect"})
    assert r1.status_code == r2.status_code == 200
    assert r1.json()["attemptId"] == r2.json()["attemptId"]


def test_create_attempt_rejects_completed(client, db):
    """Cannot start a bias that is already completed."""
    seed_defaults(db, "Framing Effect")

    r = client.post("/api/attempts", json={"bias": "Framing Effect"})
    attempt_id = r.json()["attemptId"]

    # Mark it complete
    db.execute("UPDATE bias_attempts SET completed_at = datetime('now') WHERE id = ?", (attempt_id,))
    db.commit()

    r2 = client.post("/api/attempts", json={"bias": "Framing Effect"})
    assert r2.status_code == 409


def test_create_attempt_requires_auth(anon_client):
    """No session → 401, never reaches attempt creation."""
    r = anon_client.post("/api/attempts", json={"bias": "Confirmation Bias"})
    assert r.status_code == 401


def test_create_attempt_invalid_bias(client):
    r = client.post("/api/attempts", json={"bias": "Not A Bias"})
    assert r.status_code == 400


def test_create_attempt_claude_failure_cleans_up(client, db):
    """If Claude fails, the orphaned attempt row is deleted."""
    # No defaults → will try Claude

    with patch("backend.main.get_anthropic") as mock_factory:
        mock_factory.return_value.messages.create.side_effect = Exception("API down")
        r = client.post("/api/attempts", json={"bias": "Status Quo Bias"})

    assert r.status_code == 500
    row = db.execute(
        "SELECT id FROM bias_attempts WHERE user_id = ? AND bias = 'Status Quo Bias'",
        (TEST_UID,),
    ).fetchone()
    assert row is None


# ── GET /api/attempts/{id} ──────────────────────────────────────────────────

def test_get_attempt_not_found(client):
    r = client.get("/api/attempts/99999")
    assert r.status_code == 404


def test_get_attempt_structure(client, db):
    seed_defaults(db, "Overconfidence Bias")
    r = client.post("/api/attempts", json={"bias": "Overconfidence Bias"})
    attempt_id = r.json()["attemptId"]

    r2 = client.get(f"/api/attempts/{attempt_id}")
    assert r2.status_code == 200
    data = r2.json()
    assert data["attempt"]["bias"] == "Overconfidence Bias"
    assert data["totalQuestions"] == 4
    assert data["answeredCount"] == 0
    assert data["isComplete"] is False
    assert len(data["questions"]) == 4
    # Scoring must NOT be exposed
    for q in data["questions"]:
        assert "scoring" not in q

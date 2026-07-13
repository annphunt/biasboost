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
    assert cb["inProgress"] is False
    assert cb["level"] == "Low"
    assert cb["attemptId"] is not None


def test_get_biases_in_progress_shows_partial(client, db):
    # A started-but-unfinished attempt: 1 of 2 questions answered, not completed.
    db.execute("INSERT INTO users (auth_user_id, role) VALUES (?, 'entrepreneur')", (TEST_UID,))
    cur = db.execute(
        "INSERT INTO bias_attempts (user_id, bias) VALUES (?, 'Anchoring Bias')",
        (TEST_UID,),
    )
    attempt_id = cur.lastrowid
    db.execute(
        """INSERT INTO questions
           (attempt_id, question_number, question_text, options, bias, scoring, answer_given)
           VALUES (?, 1, 'Q1', '{}', 'Anchoring Bias', '{}', 'A')""",
        (attempt_id,),
    )
    db.execute(
        """INSERT INTO questions
           (attempt_id, question_number, question_text, options, bias, scoring)
           VALUES (?, 2, 'Q2', '{}', 'Anchoring Bias', '{}')""",
        (attempt_id,),
    )
    db.commit()

    r = client.get("/api/me/biases")
    assert r.status_code == 200
    ab = next(b for b in r.json()["biases"] if b["name"] == "Anchoring Bias")
    assert ab["completed"] is False
    assert ab["inProgress"] is True
    assert ab["answered"] == 1
    assert ab["attemptId"] == attempt_id
    assert ab["level"] is None

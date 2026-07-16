"""Tests for POST /api/attempts/{id}/answer."""
import json
import pytest
from .conftest import seed_defaults


def _create_attempt(client, db, bias: str = "Confirmation Bias"):
    seed_defaults(db, bias)
    r = client.post("/api/attempts", json={"bias": bias})
    assert r.status_code == 200
    return r.json()["attemptId"]


def test_save_answer_valid(client, db):
    attempt_id = _create_attempt(client, db)
    r = client.post(f"/api/attempts/{attempt_id}/answer", json={"questionNumber": 1, "answer": "A"})
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_save_answer_all_answered_marks_complete(client, db):
    attempt_id = _create_attempt(client, db)
    for i in range(1, 5):
        r = client.post(f"/api/attempts/{attempt_id}/answer", json={"questionNumber": i, "answer": "B"})
    assert r.json()["allAnswered"] is True

    r2 = client.get(f"/api/attempts/{attempt_id}")
    assert r2.json()["isComplete"] is True

    # Score + level are persisted at completion (seed scoring: B = 1, so 4 × 1 = 4).
    row = db.execute(
        "SELECT total_score, level FROM bias_attempts WHERE id = ?", (attempt_id,)
    ).fetchone()
    assert row["total_score"] == 4
    assert row["level"] == "Low"


def test_save_answer_not_all_answered(client, db):
    attempt_id = _create_attempt(client, db)
    r = client.post(f"/api/attempts/{attempt_id}/answer", json={"questionNumber": 1, "answer": "C"})
    assert r.json()["allAnswered"] is False


def test_save_answer_invalid_letter(client, db):
    attempt_id = _create_attempt(client, db)
    r = client.post(f"/api/attempts/{attempt_id}/answer", json={"questionNumber": 1, "answer": "E"})
    assert r.status_code == 400


def test_save_answer_question_not_found(client, db):
    attempt_id = _create_attempt(client, db)
    r = client.post(f"/api/attempts/{attempt_id}/answer", json={"questionNumber": 99, "answer": "A"})
    assert r.status_code == 404

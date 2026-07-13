"""Tests for PATCH /api/me/role — switching persona wipes the user's results.

A user may only ever hold one set of results, so switching to a *different*
persona permanently deletes their bias_attempts (and the questions under them).
Switching to the persona they already have is a no-op and must NOT delete data.
"""
import json

import pytest

from .conftest import TEST_UID


def _seed_user_with_results(db, role="entrepreneur"):
    """Create a user row plus one completed attempt with a question under it."""
    db.execute(
        "INSERT INTO users (auth_user_id, role) VALUES (?, ?)", (TEST_UID, role)
    )
    cur = db.execute(
        """INSERT INTO bias_attempts (user_id, bias, completed_at, level)
           VALUES (?, ?, datetime('now'), ?)""",
        (TEST_UID, "Confirmation Bias", "High"),
    )
    attempt_id = cur.lastrowid
    db.execute(
        """INSERT INTO questions
           (attempt_id, question_number, question_text, options, bias, scoring, answer_given)
           VALUES (?, 1, 'Q1', ?, 'Confirmation Bias', ?, 'A')""",
        (attempt_id, json.dumps({"A": "a"}), json.dumps({"A": 0})),
    )
    db.commit()
    return attempt_id


def _counts(db):
    attempts = db.execute(
        "SELECT COUNT(*) c FROM bias_attempts WHERE user_id = ?", (TEST_UID,)
    ).fetchone()["c"]
    questions = db.execute("SELECT COUNT(*) c FROM questions").fetchone()["c"]
    role = db.execute(
        "SELECT role FROM users WHERE auth_user_id = ?", (TEST_UID,)
    ).fetchone()["role"]
    return attempts, questions, role


def test_switch_persona_wipes_results(client, db):
    _seed_user_with_results(db, role="entrepreneur")
    assert _counts(db) == (1, 1, "entrepreneur")

    r = client.patch("/api/me/role", json={"role": "trader"})
    assert r.status_code == 200
    assert r.json()["role"] == "trader"
    assert r.json()["deleted"] is True

    # All results gone; role updated.
    assert _counts(db) == (0, 0, "trader")


def test_same_persona_keeps_results(client, db):
    _seed_user_with_results(db, role="entrepreneur")

    r = client.patch("/api/me/role", json={"role": "entrepreneur"})
    assert r.status_code == 200
    assert r.json()["role"] == "entrepreneur"
    assert r.json()["deleted"] is False

    # Nothing deleted.
    assert _counts(db) == (1, 1, "entrepreneur")


def test_invalid_persona_rejected(client, db):
    _seed_user_with_results(db, role="entrepreneur")

    r = client.patch("/api/me/role", json={"role": "wizard"})
    assert r.status_code == 400

    # Rejected before any deletion.
    assert _counts(db) == (1, 1, "entrepreneur")


def test_role_switch_requires_auth(anon_client):
    r = anon_client.patch("/api/me/role", json={"role": "trader"})
    assert r.status_code == 401

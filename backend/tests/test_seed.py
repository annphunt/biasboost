"""Tests for POST /api/admin/seed-questions.

Roles with pinned static sets (trader, entrepreneur) insert reviewed content
directly and never call Claude. The executive role is generated on demand.
"""
import json
from unittest.mock import MagicMock, patch
import pytest
from .conftest import MOCK_CLAUDE_QUESTIONS


def _mock_claude_response(questions=None):
    if questions is None:
        questions = MOCK_CLAUDE_QUESTIONS
    mock_message = MagicMock()
    mock_message.content = [MagicMock(text=json.dumps(questions))]
    return mock_message


def test_seed_invalid_bias(client):
    r = client.post("/api/admin/seed-questions", json={"bias": "Not A Bias"})
    assert r.status_code == 400


def test_seed_invalid_role(client):
    r = client.post("/api/admin/seed-questions", json={"role": "wizard"})
    assert r.status_code == 400


# ── Static sets (entrepreneur, trader): no Claude call ───────────────────────

def test_seed_entrepreneur_static_single(client, db):
    """Entrepreneur is pinned content — seeds directly, never calls Claude."""
    with patch("backend.main.get_anthropic") as mock_anthropic:
        r = client.post("/api/admin/seed-questions", json={"bias": "Dunning-Kruger Effect"})
        mock_anthropic.assert_not_called()

    assert r.status_code == 200
    assert "Dunning-Kruger Effect" in r.json()["seeded"]
    rows = db.execute(
        "SELECT * FROM default_questions WHERE role='entrepreneur' AND bias='Dunning-Kruger Effect'"
    ).fetchall()
    assert len(rows) == 4


def test_seed_entrepreneur_static_all(client, db):
    with patch("backend.main.get_anthropic") as mock_anthropic:
        r = client.post("/api/admin/seed-questions", json={})
        mock_anthropic.assert_not_called()

    assert r.status_code == 200
    assert len(r.json()["seeded"]) == 10
    assert r.json()["failed"] == []
    total = db.execute("SELECT COUNT(*) FROM default_questions WHERE role='entrepreneur'").fetchone()[0]
    assert total == 40


def test_seed_trader_static(client, db):
    with patch("backend.main.get_anthropic") as mock_anthropic:
        r = client.post("/api/admin/seed-questions", json={"role": "trader"})
        mock_anthropic.assert_not_called()

    assert r.status_code == 200
    assert len(r.json()["seeded"]) == 10


def test_seed_executive_static(client, db):
    with patch("backend.main.get_anthropic") as mock_anthropic:
        r = client.post("/api/admin/seed-questions", json={"role": "executive", "bias": "Halo Effect"})
        mock_anthropic.assert_not_called()

    assert r.status_code == 200
    assert "Halo Effect" in r.json()["seeded"]
    rows = db.execute(
        "SELECT * FROM default_questions WHERE role='executive' AND bias='Halo Effect'"
    ).fetchall()
    assert len(rows) == 4


def test_seed_entrepreneur_idempotent(client, db):
    """Seeding the same static bias twice creates no duplicates."""
    client.post("/api/admin/seed-questions", json={"bias": "Loss Aversion"})
    client.post("/api/admin/seed-questions", json={"bias": "Loss Aversion"})
    rows = db.execute(
        "SELECT * FROM default_questions WHERE role='entrepreneur' AND bias='Loss Aversion'"
    ).fetchall()
    assert len(rows) == 4


# ── Generation path (a new, not-yet-pinned category) ─────────────────────────
# All current roles are pinned, so to exercise the Claude generation path we
# simulate an unpinned role by emptying STATIC_QUESTION_SETS. This is the path a
# brand-new category takes before its questions get reviewed and committed.

def test_seed_generated_role_calls_claude(client, db):
    with patch("backend.main.STATIC_QUESTION_SETS", {}), \
         patch("backend.main.get_anthropic") as mock_factory:
        mock_factory.return_value.messages.create.return_value = _mock_claude_response()
        r = client.post("/api/admin/seed-questions", json={"role": "executive", "bias": "Anchoring Bias"})

    assert r.status_code == 200
    assert "Anchoring Bias" in r.json()["seeded"]
    rows = db.execute(
        "SELECT * FROM default_questions WHERE role='executive' AND bias='Anchoring Bias'"
    ).fetchall()
    assert len(rows) == 4


def test_seed_generated_claude_failure(client):
    with patch("backend.main.STATIC_QUESTION_SETS", {}), \
         patch("backend.main.get_anthropic") as mock_factory:
        mock_factory.return_value.messages.create.side_effect = Exception("API error")
        r = client.post("/api/admin/seed-questions", json={"role": "executive", "bias": "Availability Heuristic"})

    assert r.status_code == 500
    data = r.json()
    assert data["seeded"] == []
    assert len(data["failed"]) == 1
    assert data["failed"][0]["bias"] == "Availability Heuristic"


def test_seed_generated_partial_failure_returns_200(client):
    """If some biases succeed and some fail, status is 200."""
    call_count = 0

    def side_effect(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise Exception("first one fails")
        return _mock_claude_response()

    with patch("backend.main.STATIC_QUESTION_SETS", {}), \
         patch("backend.main.get_anthropic") as mock_factory:
        mock_factory.return_value.messages.create.side_effect = side_effect
        r = client.post("/api/admin/seed-questions", json={"role": "executive"})

    assert r.status_code == 200
    data = r.json()
    assert len(data["seeded"]) == 9
    assert len(data["failed"]) == 1

"""Tests for POST /api/admin/seed-questions."""
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


def test_seed_single_bias(client, db):
    with patch("backend.main.get_anthropic") as mock_factory:
        mock_factory.return_value.messages.create.return_value = _mock_claude_response()
        r = client.post("/api/admin/seed-questions", json={"bias": "Dunning-Kruger Effect"})

    assert r.status_code == 200
    data = r.json()
    assert "Dunning-Kruger Effect" in data["seeded"]
    assert data["failed"] == []

    rows = db.execute(
        "SELECT * FROM default_questions WHERE bias = 'Dunning-Kruger Effect' ORDER BY question_number"
    ).fetchall()
    assert len(rows) == 4


def test_seed_claude_failure(client):
    with patch("backend.main.get_anthropic") as mock_factory:
        mock_factory.return_value.messages.create.side_effect = Exception("API error")
        r = client.post("/api/admin/seed-questions", json={"bias": "Availability Heuristic"})

    assert r.status_code == 500
    data = r.json()
    assert data["seeded"] == []
    assert len(data["failed"]) == 1
    assert data["failed"][0]["bias"] == "Availability Heuristic"


def test_seed_all_biases_success(client):
    with patch("backend.main.get_anthropic") as mock_factory:
        mock_factory.return_value.messages.create.return_value = _mock_claude_response()
        r = client.post("/api/admin/seed-questions", json={})

    assert r.status_code == 200
    data = r.json()
    assert len(data["seeded"]) == 10
    assert data["failed"] == []


def test_seed_partial_failure_returns_200(client):
    """If some succeed and some fail, status is 200."""
    call_count = 0

    def side_effect(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise Exception("first one fails")
        return _mock_claude_response()

    with patch("backend.main.get_anthropic") as mock_factory:
        mock_factory.return_value.messages.create.side_effect = side_effect
        r = client.post("/api/admin/seed-questions", json={})

    assert r.status_code == 200
    data = r.json()
    assert len(data["seeded"]) == 9
    assert len(data["failed"]) == 1


def test_seed_idempotent(client, db):
    """Seeding same bias twice should not create duplicates."""
    with patch("backend.main.get_anthropic") as mock_factory:
        mock_factory.return_value.messages.create.return_value = _mock_claude_response()
        client.post("/api/admin/seed-questions", json={"bias": "Loss Aversion"})
        client.post("/api/admin/seed-questions", json={"bias": "Loss Aversion"})

    rows = db.execute(
        "SELECT * FROM default_questions WHERE bias = 'Loss Aversion'"
    ).fetchall()
    assert len(rows) == 4  # no duplicates

"""Tests for GET /api/attempts/{id}/analysis and /analysis/detail."""
import json
from unittest.mock import MagicMock, patch, call
import pytest
from .conftest import make_user, seed_defaults


def _completed_attempt(client, db, user_id: int, bias: str = "Confirmation Bias") -> int:
    """Create an attempt, answer all questions, return attempt_id."""
    make_user(client, user_id)
    seed_defaults(db, bias)
    r = client.post("/api/attempts", json={"userId": user_id, "bias": bias})
    attempt_id = r.json()["attemptId"]
    for i in range(1, 5):
        client.post(f"/api/attempts/{attempt_id}/answer", json={"questionNumber": i, "answer": "A"})
    return attempt_id


# ── /analysis ────────────────────────────────────────────────────────────────

def test_analysis_requires_completed_attempt(client, db):
    make_user(client, 500)
    seed_defaults(db, "Sunk Cost Fallacy")
    r = client.post("/api/attempts", json={"userId": 500, "bias": "Sunk Cost Fallacy"})
    attempt_id = r.json()["attemptId"]

    r2 = client.get(f"/api/attempts/{attempt_id}/analysis")
    assert r2.status_code == 400


def test_analysis_not_found(client):
    r = client.get("/api/attempts/99999/analysis")
    assert r.status_code == 404


def test_analysis_streams_text(client, db):
    attempt_id = _completed_attempt(client, db, 501)

    mock_stream = MagicMock()
    mock_stream.__enter__ = MagicMock(return_value=mock_stream)
    mock_stream.__exit__ = MagicMock(return_value=False)
    mock_stream.text_stream = iter(["Hello ", "world."])

    with patch("backend.main.get_anthropic") as mock_factory:
        mock_factory.return_value.messages.stream.return_value = mock_stream
        mock_factory.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text="Detail text")]
        )
        r = client.get(f"/api/attempts/{attempt_id}/analysis")

    assert r.status_code == 200
    body = r.text
    assert "__META__" in body
    assert "Hello " in body
    assert "world." in body


def test_analysis_returns_cached_on_second_call(client, db):
    attempt_id = _completed_attempt(client, db, 502)

    mock_stream = MagicMock()
    mock_stream.__enter__ = MagicMock(return_value=mock_stream)
    mock_stream.__exit__ = MagicMock(return_value=False)
    mock_stream.text_stream = iter(["Cached summary."])

    with patch("backend.main.get_anthropic") as mock_factory:
        mock_factory.return_value.messages.stream.return_value = mock_stream
        mock_factory.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text="Detail")]
        )
        client.get(f"/api/attempts/{attempt_id}/analysis")

    # Second call — should return cached JSON, no streaming
    with patch("backend.main.get_anthropic") as mock_factory2:
        r2 = client.get(f"/api/attempts/{attempt_id}/analysis")
        mock_factory2.assert_not_called()

    assert r2.status_code == 200
    data = r2.json()
    assert data["cached"] is True
    assert "summary" in data


def test_analysis_meta_contains_score_and_level(client, db):
    attempt_id = _completed_attempt(client, db, 503)

    mock_stream = MagicMock()
    mock_stream.__enter__ = MagicMock(return_value=mock_stream)
    mock_stream.__exit__ = MagicMock(return_value=False)
    mock_stream.text_stream = iter(["text"])

    with patch("backend.main.get_anthropic") as mock_factory:
        mock_factory.return_value.messages.stream.return_value = mock_stream
        mock_factory.return_value.messages.create.return_value = MagicMock(
            content=[MagicMock(text="d")]
        )
        r = client.get(f"/api/attempts/{attempt_id}/analysis")

    # First line should be __META__...
    first_line = r.text.split("\n")[0]
    assert first_line.startswith("__META__")
    meta = json.loads(first_line[len("__META__"):])
    assert "totalScore" in meta
    assert "level" in meta
    assert meta["level"] in ("Low", "Medium", "High")


# ── /analysis/detail ─────────────────────────────────────────────────────────

def test_detail_not_ready_returns_202(client, db):
    attempt_id = _completed_attempt(client, db, 504)
    r = client.get(f"/api/attempts/{attempt_id}/analysis/detail")
    assert r.status_code == 202
    assert r.json()["ready"] is False


def test_detail_not_found(client):
    r = client.get("/api/attempts/99999/analysis/detail")
    assert r.status_code == 404


def test_detail_returns_when_ready(client, db):
    attempt_id = _completed_attempt(client, db, 505)
    db.execute(
        "UPDATE bias_attempts SET analysis = ? WHERE id = ?",
        ("Detailed analysis text.", attempt_id),
    )
    db.commit()

    r = client.get(f"/api/attempts/{attempt_id}/analysis/detail")
    assert r.status_code == 200
    data = r.json()
    assert data["ready"] is True
    assert data["detail"] == "Detailed analysis text."

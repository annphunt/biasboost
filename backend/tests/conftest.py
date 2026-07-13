"""Shared pytest fixtures for BiasBoost backend tests."""
import json
import os
import sqlite3
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


# ── Per-test isolated DB ──────────────────────────────────────────────────────

@pytest.fixture()
def tmp_db_path(tmp_path):
    """
    Fresh SQLite file per test, exposed via BIASBOOST_DB_PATH env var.
    Both the TestClient (running the app) and the direct `db` fixture
    pick up the same path via _db_path() → os.environ.get("BIASBOOST_DB_PATH").
    """
    db_file = str(tmp_path / "test.db")
    with patch.dict(os.environ, {"BIASBOOST_DB_PATH": db_file}):
        import backend.db as db_mod
        db_mod.init_db()
        yield db_file


# Fixed identity for the authenticated test client. The app derives the caller
# from a session cookie via the `current_user_id` dependency; in tests we
# override that dependency instead of standing up the full regstack auth stack.
TEST_UID = "test-user-1"


@pytest.fixture()
def client(tmp_db_path):
    """TestClient authenticated as TEST_UID (auth dependency overridden)."""
    from backend.main import app, current_user_id
    app.dependency_overrides[current_user_id] = lambda: TEST_UID
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.pop(current_user_id, None)


@pytest.fixture()
def anon_client(tmp_db_path):
    """Unauthenticated TestClient — no session, for asserting 401 responses."""
    from backend.main import app, current_user_id
    app.dependency_overrides.pop(current_user_id, None)  # ensure no override leaks in
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


@pytest.fixture()
def db(tmp_db_path):
    """Direct DB connection for test setup / assertion — same file as `client`."""
    import backend.db as db_mod
    conn = db_mod.get_db()
    yield conn
    conn.close()


# ── Helpers ───────────────────────────────────────────────────────────────────

def seed_defaults(db, bias: str = "Confirmation Bias"):
    """Insert 4 default questions for a bias into default_questions."""
    for i in range(1, 5):
        db.execute(
            """INSERT OR REPLACE INTO default_questions
               (bias, question_number, question_text, options, scoring)
               VALUES (?, ?, ?, ?, ?)""",
            (
                bias,
                i,
                f"Q{i} text",
                json.dumps({"A": "Opt A", "B": "Opt B", "C": "Opt C", "D": "Opt D"}),
                json.dumps({"A": 0, "B": 1, "C": 2, "D": 3}),
            ),
        )
    db.commit()


MOCK_CLAUDE_QUESTIONS = [
    {
        "bias": "Confirmation Bias",
        "question": f"Generated Q{i}",
        "options": {"A": "a", "B": "b", "C": "c", "D": "d"},
        "scoring": {"A": 0, "B": 1, "C": 2, "D": 3},
    }
    for i in range(1, 5)
]

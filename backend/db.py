import sqlite3
import os
from pathlib import Path

# Default path — overridable via BIASBOOST_DB_PATH (used in tests)
_DEFAULT_DB_PATH = str(Path(__file__).parent.parent / "biasboost.db")


def _db_path() -> str:
    return os.environ.get("BIASBOOST_DB_PATH") or _DEFAULT_DB_PATH


def get_db() -> sqlite3.Connection:
    """Open a SQLite connection for the current request."""
    db = sqlite3.connect(_db_path(), check_same_thread=False)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode = WAL")
    db.execute("PRAGMA foreign_keys = ON")
    return db


def init_db() -> None:
    """Create tables. Called once at startup.

    Schema is auth-uuid-based: users.auth_user_id is a TEXT primary key
    that matches regstack's user id. bias_attempts.user_id references it.
    default_questions is independent of users.
    """
    db = sqlite3.connect(_db_path(), check_same_thread=False)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode = WAL")
    db.execute("PRAGMA foreign_keys = ON")
    try:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS default_questions (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                role            TEXT    NOT NULL DEFAULT 'entrepreneur',
                bias            TEXT    NOT NULL,
                question_number INTEGER NOT NULL,
                question_text   TEXT    NOT NULL,
                options         TEXT    NOT NULL,
                scoring         TEXT    NOT NULL,
                UNIQUE(role, bias, question_number)
            );

            CREATE TABLE IF NOT EXISTS users (
                auth_user_id TEXT PRIMARY KEY,
                role         TEXT NOT NULL DEFAULT 'entrepreneur'
            );

            CREATE TABLE IF NOT EXISTS bias_attempts (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id          TEXT    NOT NULL REFERENCES users(auth_user_id),
                bias             TEXT    NOT NULL,
                started_at       TEXT    NOT NULL DEFAULT (datetime('now')),
                completed_at     TEXT,
                analysis         TEXT,
                level            TEXT,
                total_score      INTEGER,
                analysis_summary TEXT,
                UNIQUE(user_id, bias)
            );

            CREATE TABLE IF NOT EXISTS questions (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                attempt_id      INTEGER NOT NULL REFERENCES bias_attempts(id),
                question_number INTEGER NOT NULL,
                question_text   TEXT    NOT NULL,
                options         TEXT    NOT NULL,
                bias            TEXT    NOT NULL,
                scoring         TEXT    NOT NULL,
                answer_given    TEXT,
                answered_at     TEXT,
                UNIQUE(attempt_id, question_number)
            );
        """)

        # Lightweight migrations for pre-existing DBs (CREATE IF NOT EXISTS won't
        # add new columns to a table that already exists).
        cols = {r["name"] for r in db.execute("PRAGMA table_info(bias_attempts)")}
        if "total_score" not in cols:
            db.execute("ALTER TABLE bias_attempts ADD COLUMN total_score INTEGER")

        db.commit()
    finally:
        db.close()


def get_or_create_profile(auth_user_id: str, default_role: str = "entrepreneur") -> str:
    """Ensure a profile row exists for this regstack user. Returns the role."""
    db = get_db()
    try:
        row = db.execute(
            "SELECT role FROM users WHERE auth_user_id = ?", (auth_user_id,)
        ).fetchone()
        if row is not None:
            return row["role"]
        db.execute(
            "INSERT INTO users (auth_user_id, role) VALUES (?, ?)",
            (auth_user_id, default_role),
        )
        db.commit()
        return default_role
    finally:
        db.close()

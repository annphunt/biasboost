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
    return db


def init_db() -> None:
    """Create tables and run migrations. Called once at startup."""
    db = sqlite3.connect(_db_path(), check_same_thread=False)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA journal_mode = WAL")
    try:
        # Migrations for databases that predate these columns
        for col in ("analysis", "level", "analysis_summary"):
            try:
                db.execute(f"ALTER TABLE bias_attempts ADD COLUMN {col} TEXT")
            except sqlite3.OperationalError:
                pass  # column already exists

        # Migration: add role to users
        try:
            db.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'entrepreneur'")
            db.commit()
        except sqlite3.OperationalError:
            pass  # column already exists

        # Migration: add role column to default_questions (requires table recreation
        # because we need to change the UNIQUE constraint)
        dq_cols = [row[1] for row in db.execute("PRAGMA table_info(default_questions)").fetchall()]
        if "role" not in dq_cols and dq_cols:  # table exists but lacks role column
            db.executescript("""
                CREATE TABLE default_questions_new (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    role            TEXT    NOT NULL DEFAULT 'entrepreneur',
                    bias            TEXT    NOT NULL,
                    question_number INTEGER NOT NULL,
                    question_text   TEXT    NOT NULL,
                    options         TEXT    NOT NULL,
                    scoring         TEXT    NOT NULL,
                    UNIQUE(role, bias, question_number)
                );
                INSERT INTO default_questions_new
                    (role, bias, question_number, question_text, options, scoring)
                SELECT 'entrepreneur', bias, question_number, question_text, options, scoring
                FROM default_questions;
                DROP TABLE default_questions;
                ALTER TABLE default_questions_new RENAME TO default_questions;
            """)

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
                user_id INTEGER PRIMARY KEY,
                role    TEXT NOT NULL DEFAULT 'entrepreneur'
            );

            CREATE TABLE IF NOT EXISTS bias_attempts (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id          INTEGER NOT NULL REFERENCES users(user_id),
                bias             TEXT    NOT NULL,
                started_at       TEXT    NOT NULL DEFAULT (datetime('now')),
                completed_at     TEXT,
                analysis         TEXT,
                level            TEXT,
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
        db.commit()
    finally:
        db.close()

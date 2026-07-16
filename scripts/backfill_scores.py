#!/usr/bin/env python3
"""Backfill bias_attempts.total_score (and level) for completed attempts that
predate score persistence. Idempotent — only touches rows where total_score is
NULL. Run once locally and once on prod after deploying the schema migration.

Run:  python3 scripts/backfill_scores.py
"""
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP_DB = ROOT / "biasboost.db"


def compute_level(score: int) -> str:
    if score <= 4:
        return "Low"
    if score <= 8:
        return "Medium"
    return "High"


def main():
    db = sqlite3.connect(APP_DB)
    db.row_factory = sqlite3.Row

    # Guard: column must exist (run the app once, or apply the migration, first).
    cols = {r["name"] for r in db.execute("PRAGMA table_info(bias_attempts)")}
    if "total_score" not in cols:
        print("total_score column missing — start the app once (runs the migration) first.")
        return

    todo = db.execute(
        "SELECT id, bias FROM bias_attempts "
        "WHERE completed_at IS NOT NULL AND total_score IS NULL"
    ).fetchall()

    print(f"{len(todo)} completed attempt(s) to backfill.\n")
    updated = 0
    for row in todo:
        total = 0
        for q in db.execute(
            "SELECT answer_given, scoring FROM questions WHERE attempt_id = ?", (row["id"],)
        ):
            if q["answer_given"]:
                total += json.loads(q["scoring"]).get(q["answer_given"], 0)
        level = compute_level(total)
        db.execute(
            "UPDATE bias_attempts SET total_score = ?, level = ? WHERE id = ?",
            (total, level, row["id"]),
        )
        updated += 1
        print(f"  attempt {row['id']:>4}  {row['bias']:<24}  {total:>2}/12  {level}")
    db.commit()
    print(f"\nBackfilled {updated} attempt(s).")


if __name__ == "__main__":
    main()

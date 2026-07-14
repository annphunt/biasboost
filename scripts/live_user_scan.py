#!/usr/bin/env python3
"""LiveUserScan — who actually tried the live service.

Lists every user whose email does NOT contain "annphunt" (the owner's own test
accounts), with their selected role and completed Boosts grouped by result
colour: Red = High, Orange = Medium, Green = Low. Shows "n/a" when the user has
run no Boosts. Read-only.

Run:  python3 scripts/live_user_scan.py
"""
import sqlite3
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP_DB = ROOT / "biasboost.db"
AUTH_DB = ROOT / "backend" / "regstack.db"

EXCLUDE = "annphunt"
LEVEL_COLOUR = {"High": "red", "Medium": "orange", "Low": "green"}


def scan():
    auth = sqlite3.connect(AUTH_DB)
    app = sqlite3.connect(APP_DB)

    users = [
        (uid, email)
        for uid, email in auth.execute("SELECT id, email FROM users")
        if EXCLUDE not in (email or "").lower()
    ]
    users.sort(key=lambda r: (r[1] or "").lower())

    roles = dict(app.execute("SELECT auth_user_id, role FROM users"))

    graded = defaultdict(lambda: {"red": [], "orange": [], "green": []})
    for uid, bias, level in app.execute(
        "SELECT user_id, bias, level FROM bias_attempts "
        "WHERE completed_at IS NOT NULL AND level IS NOT NULL"
    ):
        colour = LEVEL_COLOUR.get(level)
        if colour:
            graded[uid][colour].append(bias)

    rows = []
    for uid, email in users:
        role = roles.get(uid) or "—"
        g = graded.get(uid)
        has_boosts = bool(g and (g["red"] or g["orange"] or g["green"]))
        if not has_boosts:
            rows.append((email, role, "n/a", "", ""))
        else:
            rows.append((
                email, role,
                ", ".join(g["red"]) or "—",
                ", ".join(g["orange"]) or "—",
                ", ".join(g["green"]) or "—",
            ))
    return rows


def main():
    rows = scan()
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    print(f"LiveUserScan — {len(rows)} external user(s)  ({stamp})")
    print("Colours: Red = High · Orange = Medium · Green = Low\n")

    headers = ["Email", "Role", "Red (High)", "Orange (Medium)", "Green (Low)"]
    table = [headers] + rows if rows else [headers]
    widths = [max(len(str(r[c])) for r in table) for c in range(len(headers))]

    def line(cells):
        return " | ".join(str(cells[c]).ljust(widths[c]) for c in range(len(headers)))

    print(line(headers))
    print("-+-".join("-" * w for w in widths))
    if not rows:
        print("(no external users yet)")
    for r in rows:
        print(line(r))


if __name__ == "__main__":
    main()

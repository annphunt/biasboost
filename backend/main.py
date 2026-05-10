import asyncio
import json
import os
import re
import sqlite3
from contextlib import asynccontextmanager
from typing import Any

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from db import get_db, init_db
from prompts import BIASES, BIAS_NAMES, TRADER_QUESTIONS, build_single_bias_analysis_prompt, build_single_bias_prompt, build_summary_analysis_prompt

# Load .env.local when running locally — resolve relative to this file, not cwd
_ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(dotenv_path=_ENV_PATH, override=True)

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_anthropic() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


BIAS_DEFINITIONS: dict[str, str] = {b["name"]: b["definition"] for b in BIASES}


def compute_level(score: int) -> str:
    if score <= 4:
        return "Low"
    elif score <= 8:
        return "Medium"
    return "High"


# ── POST /api/users ──────────────────────────────────────────────────────────

VALID_ROLES = {"entrepreneur", "trader"}


@app.post("/api/users", status_code=201)
def create_user(body: dict[str, Any]):
    user_id = body.get("userId")
    role = body.get("role", "entrepreneur")
    if not isinstance(user_id, int) or user_id <= 0:
        raise HTTPException(status_code=400, detail="userId must be a positive integer")
    if role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="role must be 'entrepreneur' or 'trader'")

    db = get_db()
    try:
        db.execute(
            "INSERT INTO users (user_id, role) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET role = excluded.role",
            (user_id, role),
        )
        db.commit()
    finally:
        db.close()

    return {"userId": user_id, "role": role}


# ── GET /api/users/{userId}/biases ───────────────────────────────────────────

@app.get("/api/users/{user_id}/biases")
def get_user_biases(user_id: int):
    if user_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid userId")

    db = get_db()
    try:
        rows = db.execute(
            "SELECT * FROM bias_attempts WHERE user_id = ?", (user_id,)
        ).fetchall()
    finally:
        db.close()

    completed = {
        row["bias"]: {"id": row["id"], "level": row["level"]}
        for row in rows
        if row["completed_at"] is not None
    }

    biases = [
        {
            "name": b["name"],
            "description": b["description"],
            "completed": b["name"] in completed,
            "attemptId": completed[b["name"]]["id"] if b["name"] in completed else None,
            "level": completed[b["name"]]["level"] if b["name"] in completed else None,
        }
        for b in BIASES
    ]

    return {"biases": biases}


# ── POST /api/attempts ───────────────────────────────────────────────────────

@app.post("/api/attempts")
def create_attempt(body: dict[str, Any]):
    user_id = body.get("userId")
    bias = body.get("bias")

    if not isinstance(user_id, int) or user_id <= 0:
        raise HTTPException(status_code=400, detail="userId must be a positive integer")
    if not bias or bias not in BIAS_NAMES:
        raise HTTPException(status_code=400, detail="Invalid bias name")

    db = get_db()
    try:
        user = db.execute("SELECT user_id, role FROM users WHERE user_id = ?", (user_id,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user_role = user["role"] or "entrepreneur"

        existing = db.execute(
            "SELECT completed_at FROM bias_attempts WHERE user_id = ? AND bias = ?",
            (user_id, bias),
        ).fetchone()
        if existing and existing["completed_at"]:
            raise HTTPException(status_code=409, detail="This bias has already been completed")

        # Resume incomplete attempt if one exists
        existing_attempt = db.execute(
            "SELECT id FROM bias_attempts WHERE user_id = ? AND bias = ?",
            (user_id, bias),
        ).fetchone()
        if existing_attempt:
            return {"attemptId": existing_attempt["id"]}

        # Create new attempt row
        cur = db.execute(
            "INSERT INTO bias_attempts (user_id, bias) VALUES (?, ?)", (user_id, bias)
        )
        db.commit()
        attempt_id = cur.lastrowid

        # Use default questions if seeded for this role
        defaults = db.execute(
            "SELECT * FROM default_questions WHERE role = ? AND bias = ? ORDER BY question_number",
            (user_role, bias),
        ).fetchall()

        if len(defaults) == 4:
            for q in defaults:
                db.execute(
                    "INSERT INTO questions (attempt_id, question_number, question_text, options, bias, scoring) VALUES (?, ?, ?, ?, ?, ?)",
                    (attempt_id, q["question_number"], q["question_text"], q["options"], q["bias"], q["scoring"]),
                )
            db.commit()
            return {"attemptId": attempt_id}

    finally:
        db.close()

    # Fall back: generate via Claude
    client = get_anthropic()
    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2000,
            messages=[{"role": "user", "content": build_single_bias_prompt(bias, role=user_role)}],
        )
        raw = message.content[0].text if message.content else ""
        match = re.search(r"\[[\s\S]*\]", raw)
        if not match:
            raise ValueError("No JSON array in response")
        questions = json.loads(match.group())
        if not isinstance(questions, list) or len(questions) != 4:
            raise ValueError(f"Expected 4 questions, got {len(questions) if isinstance(questions, list) else '?'}")
    except Exception as e:
        db2 = get_db()
        try:
            db2.execute("DELETE FROM bias_attempts WHERE id = ?", (attempt_id,))
            db2.commit()
        finally:
            db2.close()
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {e}")

    db3 = get_db()
    try:
        for i, q in enumerate(questions):
            db3.execute(
                "INSERT INTO questions (attempt_id, question_number, question_text, options, bias, scoring) VALUES (?, ?, ?, ?, ?, ?)",
                (attempt_id, i + 1, q["question"], json.dumps(q["options"]), q["bias"], json.dumps(q["scoring"])),
            )
        db3.commit()
    finally:
        db3.close()

    return {"attemptId": attempt_id}


# ── GET /api/attempts/{id} ───────────────────────────────────────────────────

@app.get("/api/attempts/{attempt_id}")
def get_attempt(attempt_id: int):
    db = get_db()
    try:
        attempt = db.execute(
            "SELECT * FROM bias_attempts WHERE id = ?", (attempt_id,)
        ).fetchone()
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")

        questions = db.execute(
            "SELECT * FROM questions WHERE attempt_id = ? ORDER BY question_number ASC",
            (attempt_id,),
        ).fetchall()
    finally:
        db.close()

    answered_count = sum(1 for q in questions if q["answer_given"] is not None)

    public_questions = [
        {
            "id": q["id"],
            "number": q["question_number"],
            "question": q["question_text"],
            "options": json.loads(q["options"]),
            "answer_given": q["answer_given"],
        }
        for q in questions
    ]

    return {
        "attempt": {
            "id": attempt["id"],
            "userId": attempt["user_id"],
            "bias": attempt["bias"],
            "startedAt": attempt["started_at"],
            "completedAt": attempt["completed_at"],
        },
        "questions": public_questions,
        "answeredCount": answered_count,
        "totalQuestions": len(questions),
        "isComplete": attempt["completed_at"] is not None,
    }


# ── POST /api/attempts/{id}/answer ───────────────────────────────────────────

@app.post("/api/attempts/{attempt_id}/answer")
def save_answer(attempt_id: int, body: dict[str, Any]):
    question_number = body.get("questionNumber")
    answer = body.get("answer")

    if answer not in ("A", "B", "C", "D"):
        raise HTTPException(status_code=400, detail="Answer must be A, B, C, or D")

    db = get_db()
    try:
        question = db.execute(
            "SELECT * FROM questions WHERE attempt_id = ? AND question_number = ?",
            (attempt_id, question_number),
        ).fetchone()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        db.execute(
            "UPDATE questions SET answer_given = ?, answered_at = datetime('now') WHERE id = ?",
            (answer, question["id"]),
        )

        unanswered = db.execute(
            "SELECT COUNT(*) AS cnt FROM questions WHERE attempt_id = ? AND answer_given IS NULL",
            (attempt_id,),
        ).fetchone()["cnt"]

        all_answered = unanswered == 0
        if all_answered:
            db.execute(
                "UPDATE bias_attempts SET completed_at = datetime('now') WHERE id = ?",
                (attempt_id,),
            )

        db.commit()
    finally:
        db.close()

    return {"ok": True, "allAnswered": all_answered}


# ── GET /api/attempts/{id}/analysis ─────────────────────────────────────────

@app.get("/api/attempts/{attempt_id}/analysis")
async def get_analysis(attempt_id: int):
    db = get_db()
    try:
        attempt = db.execute(
            "SELECT * FROM bias_attempts WHERE id = ?", (attempt_id,)
        ).fetchone()
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")
        if not attempt["completed_at"]:
            raise HTTPException(status_code=400, detail="Attempt is not completed")

        questions = db.execute(
            "SELECT * FROM questions WHERE attempt_id = ? ORDER BY question_number",
            (attempt_id,),
        ).fetchall()

        # Compute score
        total_score = 0
        for q in questions:
            if q["answer_given"]:
                scoring = json.loads(q["scoring"])
                total_score += scoring.get(q["answer_given"], 0)

        level = compute_level(total_score)

        # Cached path
        if attempt["analysis_summary"]:
            if not attempt["level"]:
                db.execute("UPDATE bias_attempts SET level = ? WHERE id = ?", (level, attempt_id))
                db.commit()
            return JSONResponse(
                content={
                    "cached": True,
                    "totalScore": total_score,
                    "level": attempt["level"] or level,
                    "bias": attempt["bias"],
                    "definition": BIAS_DEFINITIONS.get(attempt["bias"], ""),
                    "summary": attempt["analysis_summary"],
                    "hasDetail": attempt["analysis"] is not None,
                }
            )

        attempt_dict = dict(attempt)
        questions_list = [dict(q) for q in questions]
    finally:
        db.close()

    # Streaming path
    client = get_anthropic()

    async def generate():
        meta = {
            "totalScore": total_score,
            "level": level,
            "bias": attempt_dict["bias"],
            "definition": BIAS_DEFINITIONS.get(attempt_dict["bias"], ""),
        }
        yield f"__META__{json.dumps(meta)}\n"

        full_text = ""
        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=600,
            messages=[
                {
                    "role": "user",
                    "content": build_summary_analysis_prompt(attempt_dict["bias"], total_score, level),
                }
            ],
        ) as stream:
            for text in stream.text_stream:
                full_text += text
                yield text

        # Save summary after streaming
        db2 = get_db()
        try:
            db2.execute(
                "UPDATE bias_attempts SET analysis_summary = ?, level = ? WHERE id = ?",
                (full_text, level, attempt_id),
            )
            db2.commit()
        finally:
            db2.close()

        # Fire background detail generation
        if not attempt_dict["analysis"]:
            asyncio.create_task(_generate_detail(attempt_id, attempt_dict, questions_list, total_score, level))

    return StreamingResponse(generate(), media_type="text/plain")


async def _generate_detail(attempt_id: int, attempt: dict, questions: list, total_score: int, level: str) -> None:
    """Generate the detailed per-question analysis in the background."""
    client = get_anthropic()
    try:
        q_payload = [
            {
                "number": q["question_number"],
                "question": q["question_text"],
                "options": json.loads(q["options"]),
                "scoring": json.loads(q["scoring"]),
                "answer_given": q["answer_given"],
                "question_score": json.loads(q["scoring"]).get(q["answer_given"], 0),
            }
            for q in questions
            if q["answer_given"]
        ]

        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=800,
            messages=[
                {
                    "role": "user",
                    "content": build_single_bias_analysis_prompt(
                        bias=attempt["bias"],
                        total_score=total_score,
                        level=level,
                        questions=q_payload,
                    ),
                }
            ],
        )
        detail = message.content[0].text if message.content else ""

        db = get_db()
        try:
            db.execute("UPDATE bias_attempts SET analysis = ? WHERE id = ?", (detail, attempt_id))
            db.commit()
        finally:
            db.close()

    except Exception as e:
        print(f"[detail generation error] attempt {attempt_id}: {e}")


# ── GET /api/attempts/{id}/analysis/detail ───────────────────────────────────

@app.get("/api/attempts/{attempt_id}/analysis/detail")
def get_analysis_detail(attempt_id: int):
    db = get_db()
    try:
        attempt = db.execute(
            "SELECT * FROM bias_attempts WHERE id = ?", (attempt_id,)
        ).fetchone()
        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")

        if not attempt["analysis"]:
            return JSONResponse(content={"ready": False}, status_code=202)

        return {"ready": True, "detail": attempt["analysis"]}
    finally:
        db.close()


# ── POST /api/admin/seed-questions ───────────────────────────────────────────

@app.post("/api/admin/seed-questions")
def seed_questions(request: Request, body: dict[str, Any] = {}):
    target_bias = body.get("bias")
    role = body.get("role", "entrepreneur")

    if role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="role must be 'entrepreneur' or 'trader'")

    if target_bias:
        biases_to_seed = [b for b in BIASES if b["name"] == target_bias]
        if not biases_to_seed:
            raise HTTPException(status_code=400, detail="Invalid bias name")
    else:
        biases_to_seed = list(BIASES)

    seeded = []
    failed = []

    # Trader questions come from hardcoded data — no Claude needed
    if role == "trader":
        db = get_db()
        try:
            for bias_obj in biases_to_seed:
                name = bias_obj["name"]
                questions = TRADER_QUESTIONS.get(name)
                if not questions:
                    failed.append({"bias": name, "error": "No trader questions defined"})
                    continue
                try:
                    for i, q in enumerate(questions):
                        db.execute(
                            """INSERT OR REPLACE INTO default_questions
                               (role, bias, question_number, question_text, options, scoring)
                               VALUES (?, ?, ?, ?, ?, ?)""",
                            (role, name, i + 1, q["question"], json.dumps(q["options"]), json.dumps(q["scoring"])),
                        )
                    db.commit()
                    seeded.append(name)
                except Exception as e:
                    failed.append({"bias": name, "error": str(e)})
        finally:
            db.close()

        all_failed = len(failed) == len(biases_to_seed)
        return JSONResponse(
            content={"seeded": seeded, "failed": failed},
            status_code=500 if all_failed else 200,
        )

    # Entrepreneur questions generated via Claude
    client = get_anthropic()

    for bias_obj in biases_to_seed:
        name = bias_obj["name"]
        try:
            message = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=2000,
                messages=[{"role": "user", "content": build_single_bias_prompt(name, role=role)}],
            )
            raw = message.content[0].text if message.content else ""
            match = re.search(r"\[[\s\S]*\]", raw)
            if not match:
                raise ValueError("No JSON array in response")

            questions = json.loads(match.group())
            if not isinstance(questions, list) or len(questions) != 4:
                raise ValueError(f"Expected 4 questions, got {len(questions)}")

            db = get_db()
            try:
                for i, q in enumerate(questions):
                    db.execute(
                        """INSERT OR REPLACE INTO default_questions
                           (role, bias, question_number, question_text, options, scoring)
                           VALUES (?, ?, ?, ?, ?, ?)""",
                        (role, name, i + 1, q["question"], json.dumps(q["options"]), json.dumps(q["scoring"])),
                    )
                db.commit()
            finally:
                db.close()

            seeded.append(name)

        except Exception as e:
            failed.append({"bias": name, "error": str(e)})

    all_failed = len(failed) == len(biases_to_seed)
    return JSONResponse(
        content={"seeded": seeded, "failed": failed},
        status_code=500 if all_failed else 200,
    )

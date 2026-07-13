import asyncio
import json
import os
import re
import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any

import anthropic
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, EmailStr, Field
from regstack import RegStack, RegStackConfig
from regstack.auth.jwt import TokenError, is_payload_bulk_revoked
from regstack.models.user import BaseUser

from db import get_db, get_or_create_profile, init_db
from prompts import BIASES, BIAS_NAMES, TRADER_QUESTIONS, build_single_bias_analysis_prompt, build_single_bias_prompt, build_summary_analysis_prompt

# Load .env.local when running locally — resolve relative to this file, not cwd
_ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local")
load_dotenv(dotenv_path=_ENV_PATH, override=True)

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
SESSION_COOKIE = os.environ.get("BIASBOOST_SESSION_COOKIE", "bb_session")

# Build regstack — reads REGSTACK_* env vars
regstack_config = RegStackConfig.load()
rs = RegStack(config=regstack_config)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    await rs.install_schema()
    yield
    await rs.aclose()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount regstack's JSON router. Provides POST /register, POST /verify, etc.
# We intentionally do NOT use its /login or /logout — those return bearer
# tokens; we supply cookie-flavored equivalents below at /api/login,
# /api/logout, and prefer our /api/me over its /account/me.
app.include_router(rs.router, prefix=regstack_config.api_prefix)


def get_anthropic() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


BIAS_DEFINITIONS: dict[str, str] = {b["name"]: b["definition"] for b in BIASES}


def compute_level(score: int) -> str:
    if score <= 4:
        return "Low"
    elif score <= 8:
        return "Medium"
    return "High"


VALID_ROLES = {"entrepreneur", "trader"}


# ── Auth: cookie-based session on top of regstack's bearer JWT ───────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


def _set_session_cookie(response: Response, token: str, max_age: int) -> None:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        max_age=max_age,
        httponly=True,
        secure=str(regstack_config.base_url).startswith("https"),
        samesite="lax",
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=SESSION_COOKIE, path="/")


@app.post("/api/login")
async def login(payload: LoginRequest, response: Response):
    decision = await rs.lockout.check(payload.email)
    if decision.locked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed attempts. Try again in {decision.retry_after_seconds} seconds.",
        )

    user = await rs.users.get_by_email(payload.email)
    if user is None or user.id is None or user.hashed_password is None:
        await rs.lockout.record_failure(payload.email)
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not rs.password_hasher.verify(payload.password, user.hashed_password):
        await rs.lockout.record_failure(payload.email)
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled.")
    if rs.config.require_verification and not user.is_verified:
        raise HTTPException(status_code=403, detail="Email address has not been verified.")

    token, token_payload = rs.jwt.encode(user.id)
    await rs.users.set_last_login(user.id, token_payload.iat)
    await rs.lockout.clear(user.email)
    await rs.hooks.fire("user_logged_in", user=user)

    role = get_or_create_profile(user.id)
    _set_session_cookie(response, token, max_age=rs.config.jwt_ttl_seconds)
    return {"id": user.id, "email": user.email, "role": role}


@app.post("/api/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        try:
            payload = rs.jwt.decode(token)
            await rs.blacklist.revoke(payload.jti, payload.exp)
        except TokenError:
            pass
    _clear_session_cookie(response)
    return {"ok": True}


async def get_current_user(request: Request) -> BaseUser:
    """Read the session cookie, verify the JWT, return the BaseUser."""
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = rs.jwt.decode(token)
    except TokenError:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    if await rs.blacklist.is_revoked(payload.jti):
        raise HTTPException(status_code=401, detail="Session has been revoked")
    user = await rs.users.get_by_id(payload.sub)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User no longer active")
    if is_payload_bulk_revoked(payload, user.tokens_invalidated_after):
        raise HTTPException(status_code=401, detail="Session was invalidated; please sign in again")
    request.state.regstack_user = user
    return user


def current_user_id(user: BaseUser = Depends(get_current_user)) -> str:
    assert user.id is not None
    return user.id


# ── GET /api/me ──────────────────────────────────────────────────────────────

@app.get("/api/me")
def get_me(user: BaseUser = Depends(get_current_user)):
    assert user.id is not None
    role = get_or_create_profile(user.id)
    return {"id": user.id, "email": user.email, "role": role}


# ── PATCH /api/me/role ───────────────────────────────────────────────────────

class RoleUpdate(BaseModel):
    role: str


@app.patch("/api/me/role")
def update_role(body: RoleUpdate, user_id: str = Depends(current_user_id)):
    if body.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="role must be 'entrepreneur' or 'trader'")
    current_role = get_or_create_profile(user_id)  # ensure row exists

    # Same persona — nothing to do, and crucially no destructive wipe.
    if body.role == current_role:
        return {"id": user_id, "role": current_role, "deleted": False}

    # Switching persona is destructive: a user may only ever hold one set of
    # results. Wipe all of their attempts (and the questions under them) so the
    # new persona starts from a clean slate.
    db = get_db()
    try:
        db.execute(
            """DELETE FROM questions
               WHERE attempt_id IN (SELECT id FROM bias_attempts WHERE user_id = ?)""",
            (user_id,),
        )
        db.execute("DELETE FROM bias_attempts WHERE user_id = ?", (user_id,))
        db.execute("UPDATE users SET role = ? WHERE auth_user_id = ?", (body.role, user_id))
        db.commit()
    finally:
        db.close()
    return {"id": user_id, "role": body.role, "deleted": True}


# ── GET /api/me/biases ───────────────────────────────────────────────────────

@app.get("/api/me/biases")
def get_my_biases(user_id: str = Depends(current_user_id)):
    get_or_create_profile(user_id)
    db = get_db()
    try:
        rows = db.execute(
            "SELECT * FROM bias_attempts WHERE user_id = ?", (user_id,)
        ).fetchall()
        answered_rows = db.execute(
            """SELECT attempt_id, COUNT(*) AS answered
               FROM questions
               WHERE attempt_id IN (SELECT id FROM bias_attempts WHERE user_id = ?)
                 AND answer_given IS NOT NULL
               GROUP BY attempt_id""",
            (user_id,),
        ).fetchall()
    finally:
        db.close()

    answered_by_attempt = {r["attempt_id"]: r["answered"] for r in answered_rows}

    # At most one attempt per bias (UNIQUE(user_id, bias)), so index by bias name.
    by_bias = {}
    for row in rows:
        is_completed = row["completed_at"] is not None
        answered = answered_by_attempt.get(row["id"], 0)
        by_bias[row["bias"]] = {
            "attemptId": row["id"],
            "completed": is_completed,
            "level": row["level"],
            "answered": answered,
            # started but not finished (at least one answer, not all done)
            "inProgress": (not is_completed) and answered > 0,
        }

    biases = []
    for b in BIASES:
        info = by_bias.get(b["name"])
        biases.append({
            "name": b["name"],
            "description": b["description"],
            "completed": bool(info and info["completed"]),
            "inProgress": bool(info and info["inProgress"]),
            "answered": info["answered"] if info else 0,
            "attemptId": info["attemptId"] if info else None,
            "level": info["level"] if (info and info["completed"]) else None,
        })

    return {"biases": biases}


# ── POST /api/attempts ───────────────────────────────────────────────────────

class CreateAttemptRequest(BaseModel):
    bias: str


@app.post("/api/attempts")
def create_attempt(body: CreateAttemptRequest, user_id: str = Depends(current_user_id)):
    bias = body.bias
    if not bias or bias not in BIAS_NAMES:
        raise HTTPException(status_code=400, detail="Invalid bias name")

    user_role = get_or_create_profile(user_id)

    db = get_db()
    try:
        existing = db.execute(
            "SELECT completed_at FROM bias_attempts WHERE user_id = ? AND bias = ?",
            (user_id, bias),
        ).fetchone()
        if existing and existing["completed_at"]:
            raise HTTPException(status_code=409, detail="This bias has already been completed")

        existing_attempt = db.execute(
            "SELECT id FROM bias_attempts WHERE user_id = ? AND bias = ?",
            (user_id, bias),
        ).fetchone()
        if existing_attempt:
            return {"attemptId": existing_attempt["id"]}

        cur = db.execute(
            "INSERT INTO bias_attempts (user_id, bias) VALUES (?, ?)", (user_id, bias)
        )
        db.commit()
        attempt_id = cur.lastrowid

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


def _load_owned_attempt(attempt_id: int, user_id: str) -> sqlite3.Row:
    """Fetch an attempt and verify it belongs to the caller. Closes its own conn."""
    db = get_db()
    try:
        attempt = db.execute(
            "SELECT * FROM bias_attempts WHERE id = ?", (attempt_id,)
        ).fetchone()
    finally:
        db.close()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your attempt")
    return attempt


# ── GET /api/attempts/{id} ───────────────────────────────────────────────────

@app.get("/api/attempts/{attempt_id}")
def get_attempt(attempt_id: int, user_id: str = Depends(current_user_id)):
    attempt = _load_owned_attempt(attempt_id, user_id)

    db = get_db()
    try:
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
def save_answer(attempt_id: int, body: dict[str, Any], user_id: str = Depends(current_user_id)):
    _load_owned_attempt(attempt_id, user_id)
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
async def get_analysis(attempt_id: int, user_id: str = Depends(current_user_id)):
    _load_owned_attempt(attempt_id, user_id)
    db = get_db()
    try:
        attempt = db.execute(
            "SELECT * FROM bias_attempts WHERE id = ?", (attempt_id,)
        ).fetchone()
        if not attempt["completed_at"]:
            raise HTTPException(status_code=400, detail="Attempt is not completed")

        questions = db.execute(
            "SELECT * FROM questions WHERE attempt_id = ? ORDER BY question_number",
            (attempt_id,),
        ).fetchall()

        total_score = 0
        for q in questions:
            if q["answer_given"]:
                scoring = json.loads(q["scoring"])
                total_score += scoring.get(q["answer_given"], 0)

        level = compute_level(total_score)

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

        db2 = get_db()
        try:
            db2.execute(
                "UPDATE bias_attempts SET analysis_summary = ?, level = ? WHERE id = ?",
                (full_text, level, attempt_id),
            )
            db2.commit()
        finally:
            db2.close()

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
def get_analysis_detail(attempt_id: int, user_id: str = Depends(current_user_id)):
    _load_owned_attempt(attempt_id, user_id)
    db = get_db()
    try:
        attempt = db.execute(
            "SELECT * FROM bias_attempts WHERE id = ?", (attempt_id,)
        ).fetchone()
        if not attempt["analysis"]:
            return JSONResponse(content={"ready": False}, status_code=202)
        return {"ready": True, "detail": attempt["analysis"]}
    finally:
        db.close()


# ── POST /api/admin/seed-questions ───────────────────────────────────────────
# TODO(phase-4): restrict to admins. Currently open since it only writes seed
# content (no user data) and is invoked manually during setup.

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

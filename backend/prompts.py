from typing import Literal

BIASES = [
    {"name": "Confirmation Bias",     "description": "Favouring information that confirms what you already believe."},
    {"name": "Anchoring Bias",         "description": "Over-relying on the first piece of information you encounter."},
    {"name": "Availability Heuristic", "description": "Overweighting examples that come easily to mind."},
    {"name": "Overconfidence Bias",    "description": "Overestimating the accuracy of your own judgements."},
    {"name": "Loss Aversion",          "description": "Feeling losses more acutely than equivalent gains."},
    {"name": "Sunk Cost Fallacy",      "description": "Continuing a course of action because of past investment, not future value."},
    {"name": "Halo Effect",            "description": "Letting one positive trait colour your overall judgement of a person or thing."},
    {"name": "Framing Effect",         "description": "Being swayed by how information is presented rather than what it says."},
    {"name": "Status Quo Bias",        "description": "Preferring the current state of affairs and resisting change."},
    {"name": "Dunning-Kruger Effect",  "description": "Overestimating your competence in areas where your knowledge is limited."},
]

BIAS_NAMES = [b["name"] for b in BIASES]

Level = Literal["Low", "Medium", "High"]


def build_single_bias_prompt(bias: str) -> str:
    return f"""You are a behavioural psychologist designing a cognitive bias assessment for experienced professionals (founders, executives, investors).

Generate exactly 4 multiple-choice questions that test "{bias}".

Requirements:
- All 4 questions must specifically probe "{bias}" — but subtly, without naming it
- Use senior decision-making scenarios: hiring/promotion, strategy, capital allocation, risk, board dynamics, evaluating people or data
- All 4 options (A-D) must sound equally reasonable and defensible to a senior professional
- Questions must be subtle — do NOT signal what bias is being tested
- Avoid textbook-style or obvious bias questions
- Use non-linear scoring (0–3 per question, where 3 = strongest bias expression)
- Occasionally invert expected patterns so that more "analytical" answers are not always lower-bias
- The 4 questions should cover meaningfully different scenarios

Output ONLY a valid JSON array of exactly 4 objects — no markdown, no explanation, no extra text:
[
  {{
    "bias": "{bias}",
    "question": "...",
    "options": {{ "A": "...", "B": "...", "C": "...", "D": "..." }},
    "scoring": {{ "A": 2, "B": 0, "C": 3, "D": 1 }}
  }}
]"""


def build_summary_analysis_prompt(bias: str, total_score: int, level: str) -> str:
    return f"""You are a behavioural psychologist. A professional has just completed a 4-question assessment and scored {total_score} out of 12 on {bias}, placing them in the {level} range (Low = 0–4, Medium = 5–8, High = 9–12).

Write exactly two short paragraphs — no headers, no bullets, plain English:

Paragraph 1: What is {bias}? Explain it in 1–2 sentences as if speaking to a smart professional who has never heard the term. No jargon.

Paragraph 2: What does a {level} score mean in practice? Be specific about how this level of {bias} shows up in the decisions and behaviour of a senior professional. Under 3 sentences.

No headers. No bullets. Plain prose only."""


def build_single_bias_analysis_prompt(
    bias: str,
    total_score: int,
    level: str,
    questions: list[dict],
) -> str:
    def _fmt_question(q: dict) -> str:
        opts = " | ".join(f"{k}) {v}" for k, v in q["options"].items())
        chosen_text = q["options"][q["answer_given"]]
        return (
            f"Question {q['number']}: \"{q['question']}\"\n"
            f"  Options: {opts}\n"
            f"  Answer given: {q['answer_given']} — \"{chosen_text}\"\n"
            f"  Score for this answer: {q['question_score']} out of 3"
        )

    question_detail = "\n\n".join(_fmt_question(q) for q in questions)

    return f"""You are a behavioural psychologist writing a short, plain-English analysis for a professional who just completed a 4-question assessment on {bias}.

Their total score was {total_score} out of 12, which places them in the {level} range (Low = 0–4, Medium = 5–8, High = 9–12).

Here are the 4 questions, the answer they chose, and the score that answer received (higher score = stronger expression of the bias):

{question_detail}

Write a clear, natural explanation in three short paragraphs. Do not use headers, bullet points, or markdown formatting. Write in plain prose as if speaking directly to the person.

Paragraph 1: Tell them their result — the score, what {level} means for {bias} in plain terms, and what it typically looks like in the day-to-day decisions of a senior professional. Be concrete, not abstract.

Paragraph 2: Point to the specific question or questions where the bias showed up most clearly (score 2 or 3). Describe what they chose and explain in plain language why that response reflects {bias}. Be precise — quote or closely paraphrase their answer. If all scores were 0 or 1, say so and note which question came closest.

Paragraph 3: One or two sentences on what someone with this pattern might want to watch for in real decisions. Keep it practical and direct — no coaching clichés, no motivational language.

Write as if you are a trusted colleague giving honest, useful feedback. Avoid jargon. Use plain English throughout."""

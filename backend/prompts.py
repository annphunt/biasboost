from typing import Literal

BIASES = [
    {
        "name": "Confirmation Bias",
        "description": "Favouring information that confirms what you already believe.",
        "definition": "Confirmation bias is the tendency to search for, favour, and recall information that supports your existing beliefs — while unconsciously discounting evidence that challenges them. It's not stubbornness; it's an automatic mental shortcut that affects even the most analytical thinkers. The result is that your views feel increasingly well-supported over time, even when the underlying evidence is mixed.",
    },
    {
        "name": "Anchoring Bias",
        "description": "Over-relying on the first piece of information you encounter.",
        "definition": "Anchoring bias is the tendency to rely too heavily on the first piece of information you receive when making a decision. That initial number, estimate, or framing — the anchor — shapes all your subsequent thinking, even when it's arbitrary or shouldn't be relevant. It's why the opening offer in a negotiation matters so much, and why first impressions are so hard to revise.",
    },
    {
        "name": "Availability Heuristic",
        "description": "Overweighting examples that come easily to mind.",
        "definition": "The availability heuristic is the tendency to judge how likely or common something is based on how easily an example comes to mind. Because recent, dramatic, or emotionally vivid events are easier to recall, we overestimate their frequency and probability. This is why people overestimate the risk of plane crashes and underestimate everyday hazards — the dramatic examples are simply more memorable.",
    },
    {
        "name": "Overconfidence Bias",
        "description": "Overestimating the accuracy of your own judgements.",
        "definition": "Overconfidence bias is the tendency to overestimate the accuracy of your own knowledge, forecasts, and abilities. Most people — including domain experts — believe their judgements are more reliable than they actually are. It manifests as overly narrow confidence intervals, underestimated timelines, and a tendency to act on conviction before the evidence warrants it.",
    },
    {
        "name": "Loss Aversion",
        "description": "Feeling losses more acutely than equivalent gains.",
        "definition": "Loss aversion is the tendency to feel the pain of losing something roughly twice as intensely as the pleasure of gaining something equivalent. It's not irrational to dislike losses — but when losses loom disproportionately large, they distort decisions: we hold onto failing positions too long, avoid necessary risks, and accept worse expected outcomes just to avoid the possibility of loss.",
    },
    {
        "name": "Sunk Cost Fallacy",
        "description": "Continuing a course of action because of past investment, not future value.",
        "definition": "The sunk cost fallacy is the tendency to continue investing time, money, or effort into something because of what has already been spent — rather than based on its future prospects. Past costs are unrecoverable regardless of what you do next. Yet they continue to pull decisions forward, turning what should be a forward-looking question into an emotional defence of past choices.",
    },
    {
        "name": "Halo Effect",
        "description": "Letting one positive trait colour your overall judgement of a person or thing.",
        "definition": "The halo effect is the tendency to let one positive impression of a person, brand, or idea colour your overall judgement of them. Attractiveness, confidence, or early success in one domain leads us to assume competence and virtue in unrelated areas. It's why charismatic leaders often escape scrutiny, and why strong first impressions are so difficult to revise even with contradictory evidence.",
    },
    {
        "name": "Framing Effect",
        "description": "Being swayed by how information is presented rather than what it says.",
        "definition": "The framing effect is the tendency to respond differently to the same information depending on how it's presented. A 90% survival rate and a 10% mortality rate are identical facts — but they don't feel the same. Whether data is framed as a gain or a loss, a percentage or a raw number, a risk or an opportunity, it meaningfully shifts the decisions that follow.",
    },
    {
        "name": "Status Quo Bias",
        "description": "Preferring the current state of affairs and resisting change.",
        "definition": "Status quo bias is a preference for the current state of affairs, leading people to resist change even when an alternative would be objectively better. The default option carries disproportionate weight simply because it's familiar and because any change introduces perceived risk. It's why organisations persist with outdated processes, and why 'do nothing' is so often the implicit winner in decisions.",
    },
    {
        "name": "Dunning-Kruger Effect",
        "description": "Overestimating your competence in areas where your knowledge is limited.",
        "definition": "The Dunning-Kruger effect describes how people with limited knowledge in a domain tend to overestimate their competence — while genuine experts often underestimate theirs. The core problem is metacognitive: the less you know, the less equipped you are to recognise what you don't know. It's why novices act with great confidence and why mastery tends to produce more caution, not less.",
    },
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

Write exactly one short paragraph — no headers, no bullets, plain English:

What does a {level} score mean in practice for this person? Be specific about how this level of {bias} shows up in the decisions and behaviour of a senior professional. Under 3 sentences. Speak directly to the reader (use "you" and "your").

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

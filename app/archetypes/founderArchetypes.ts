// Founder Archetype dataset.
//
// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ PLACEHOLDER DATA — illustrative reference profiles only.
//
// The `referenceScores` below are hand-picked placeholders on BiasBoost's 0–12
// bias scale (Low 0–4 / Medium 5–8 / High 9–12). They are NOT validated
// psychometrics. Edit the numbers freely — defining biases are set high,
// contrasting biases low, so each archetype has a distinct silhouette. The
// comparison component reads these values directly, so changing a number here
// immediately changes the chart, similarity score and interpretation.
//
// To add a whole new category (Executive, Trader, Investor…), create a sibling
// file exporting an `ArchetypeCategory` of the same shape — no UI changes.
// ─────────────────────────────────────────────────────────────────────────────

import type { ArchetypeCategory, BiasAxis } from "./types";

/** The 10 Founder biases, in the order used across BiasBoost. */
export const FOUNDER_BIASES: BiasAxis[] = [
  { name: "Confirmation Bias", short: "Confirm." },
  { name: "Anchoring Bias", short: "Anchor" },
  { name: "Availability Heuristic", short: "Avail." },
  { name: "Overconfidence Bias", short: "Overconf." },
  { name: "Loss Aversion", short: "Loss Av." },
  { name: "Sunk Cost Fallacy", short: "Sunk Cost" },
  { name: "Halo Effect", short: "Halo" },
  { name: "Framing Effect", short: "Framing" },
  { name: "Status Quo Bias", short: "Status Quo" },
  { name: "Dunning-Kruger Effect", short: "D–K" },
];

export const FOUNDER_CATEGORY: ArchetypeCategory = {
  id: "founder",
  name: "Founder",
  scoreMax: 12,
  biases: FOUNDER_BIASES,
  archetypes: [
    {
      id: "visionary",
      name: "Visionary Founder",
      shortDescription:
        "This reference profile is characterised by optimism, confidence under uncertainty and a willingness to pursue ambitious opportunities.",
      referenceScores: {
        "Confirmation Bias": 7,
        "Anchoring Bias": 4,
        "Availability Heuristic": 9,
        "Overconfidence Bias": 11,
        "Loss Aversion": 2,
        "Sunk Cost Fallacy": 5,
        "Halo Effect": 7,
        "Framing Effect": 8,
        "Status Quo Bias": 2,
        "Dunning-Kruger Effect": 9,
      },
      strengths: [
        "Moves decisively when others hesitate",
        "Comfortable committing under high uncertainty",
        "Energises people around an ambitious vision",
      ],
      risks: [
        "May underweight downside scenarios",
        "Can over-trust an early, vivid signal",
        "Confidence can outrun evidence",
      ],
      coachingSummary:
        "Pair the drive to move fast with a deliberate habit of stress-testing the downside before committing.",
    },
    {
      id: "operational-protector",
      name: "Operational Protector",
      shortDescription:
        "This reference profile is characterised by caution, risk-awareness and a strong preference for protecting what already works.",
      referenceScores: {
        "Confirmation Bias": 6,
        "Anchoring Bias": 9,
        "Availability Heuristic": 5,
        "Overconfidence Bias": 3,
        "Loss Aversion": 11,
        "Sunk Cost Fallacy": 9,
        "Halo Effect": 4,
        "Framing Effect": 6,
        "Status Quo Bias": 10,
        "Dunning-Kruger Effect": 3,
      },
      strengths: [
        "Protects the business from avoidable downside",
        "Grounded, evidence-seeking under pressure",
        "Reliable, consistent decision-making",
      ],
      risks: [
        "May hold onto commitments past their value",
        "Can default to the status quo too readily",
        "Loss-aversion can stall bold-but-needed bets",
      ],
      coachingSummary:
        "Keep the disciplined risk instinct, but set explicit criteria for when to exit a sunk cost or break from the status quo.",
    },
    {
      id: "intellectual-strategist",
      name: "Intellectual Strategist",
      shortDescription:
        "This reference profile is characterised by analytical rigour, structured reasoning and a preference for well-modelled decisions.",
      referenceScores: {
        "Confirmation Bias": 9,
        "Anchoring Bias": 8,
        "Availability Heuristic": 3,
        "Overconfidence Bias": 6,
        "Loss Aversion": 5,
        "Sunk Cost Fallacy": 6,
        "Halo Effect": 3,
        "Framing Effect": 4,
        "Status Quo Bias": 5,
        "Dunning-Kruger Effect": 4,
      },
      strengths: [
        "Reasons from structure rather than vivid anecdotes",
        "Resistant to surface framing and halo effects",
        "Builds well-argued, defensible decisions",
      ],
      risks: [
        "Can over-fit to a favoured hypothesis or model",
        "May anchor on an initial framing of the problem",
        "Rigour can slow decisive action",
      ],
      coachingSummary:
        "Guard the analytical strength by actively seeking disconfirming evidence for your leading hypothesis.",
    },
    {
      id: "relationship-oriented-leader",
      name: "Relationship-Oriented Leader",
      shortDescription:
        "This reference profile is characterised by people-focus, trust-building and sensitivity to how decisions land with others.",
      referenceScores: {
        "Confirmation Bias": 8,
        "Anchoring Bias": 4,
        "Availability Heuristic": 6,
        "Overconfidence Bias": 4,
        "Loss Aversion": 6,
        "Sunk Cost Fallacy": 7,
        "Halo Effect": 11,
        "Framing Effect": 9,
        "Status Quo Bias": 6,
        "Dunning-Kruger Effect": 3,
      },
      strengths: [
        "Builds trust and alignment quickly",
        "Reads people and context well",
        "Keeps teams motivated through change",
      ],
      risks: [
        "A strong first impression can colour later judgement",
        "Sensitive to how choices are framed",
        "May persist with people-commitments too long",
      ],
      coachingSummary:
        "Balance strong people-instincts by separating a person's track record from the specific decision in front of you.",
    },
  ],
};

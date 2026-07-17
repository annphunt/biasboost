// Shared, domain-agnostic types for the Archetype Comparison feature.
//
// The comparison UI knows NOTHING about founders (or executives, traders, …).
// It consumes an `ArchetypeCategory` dataset and renders automatically. To add a
// new category later (Executive, Trader, Investor) you only add a new data file
// shaped like this — no component changes required.

/** A map of bias name → score on the category's 0..scoreMax scale. */
export type BiasScores = Record<string, number>;

/** One bias axis in a category, with a short label for compact chart display. */
export interface BiasAxis {
  /** Canonical bias name — must match the keys used in every referenceScores map. */
  name: string;
  /** Short label shown under the chart bars (falls back to `name` if omitted). */
  short: string;
}

/**
 * A reference cognitive pattern commonly seen within a category.
 *
 * NOTE: an archetype is NOT a personality type or a diagnosis. It is an
 * illustrative reference profile the user's results are *compared against* —
 * never something the user "is".
 */
export interface Archetype {
  id: string;
  name: string;
  /** One-sentence characterisation, shown in the interpretation panel. */
  shortDescription: string;
  /** Reference score for EVERY bias in the category (same 0..scoreMax scale). */
  referenceScores: BiasScores;
  strengths: string[];
  risks: string[];
  /** A short coaching-style takeaway for this reference profile. */
  coachingSummary: string;
}

/**
 * A group of archetypes that share the same bias axes and score scale
 * (e.g. "Founder"). The comparison component receives one of these plus the
 * user's scores and renders everything from it.
 */
export interface ArchetypeCategory {
  id: string;
  /** Human name of the category, e.g. "Founder". Used in headings/labels. */
  name: string;
  /** Ordered bias axes for the x-axis of the chart. */
  biases: BiasAxis[];
  /** Maximum possible score on this category's scale (BiasBoost uses 12). */
  scoreMax: number;
  archetypes: Archetype[];
}

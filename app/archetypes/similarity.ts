// Pure comparison logic for the Archetype Comparison feature.
//
// Everything here is side-effect-free and framework-free so it can be unit
// tested in isolation (see tests/archetypeSimilarity.test.ts). The UI layer
// composes sentences and renders from these results.

import type { Archetype, ArchetypeCategory, BiasAxis, BiasScores } from "./types";

/**
 * Similarity between a user profile and a reference profile, as a 0–100%.
 *
 * Defined as the mean absolute difference across the biases, normalised by the
 * scale maximum and inverted: identical profiles → 100, maximally opposite → 0.
 * This is a plain comparison against the reference profile only — it makes no
 * statistical claim.
 */
export function similarityPercent(
  user: BiasScores,
  reference: BiasScores,
  biases: BiasAxis[],
  scoreMax: number,
): number {
  if (biases.length === 0 || scoreMax <= 0) return 0;
  const totalAbsDiff = biases.reduce((sum, { name }) => {
    const u = user[name] ?? 0;
    const r = reference[name] ?? 0;
    return sum + Math.abs(u - r);
  }, 0);
  const meanAbsDiff = totalAbsDiff / biases.length;
  const pct = 100 * (1 - meanAbsDiff / scoreMax);
  // Clamp for safety (e.g. user scores that exceed scoreMax) and round.
  return Math.round(Math.min(100, Math.max(0, pct)));
}

export interface RankedArchetype {
  archetype: Archetype;
  similarity: number;
}

/** Archetypes ranked by similarity to the user, highest first. Stable order. */
export function rankArchetypes(
  user: BiasScores,
  category: ArchetypeCategory,
): RankedArchetype[] {
  return category.archetypes
    .map((archetype) => ({
      archetype,
      similarity: similarityPercent(
        user,
        archetype.referenceScores,
        category.biases,
        category.scoreMax,
      ),
    }))
    .sort((a, b) => b.similarity - a.similarity);
}

/** The single closest-matching archetype (highest similarity). */
export function closestArchetype(
  user: BiasScores,
  category: ArchetypeCategory,
): RankedArchetype | null {
  const ranked = rankArchetypes(user, category);
  return ranked.length > 0 ? ranked[0] : null;
}

export interface ComparisonDelta {
  bias: string;
  /** user − reference. Positive = user scores higher than the reference. */
  delta: number;
}

export interface ComparisonSummary {
  /** Biases where the user notably exceeds the reference (largest first). */
  higher: ComparisonDelta[];
  /** Biases where the user is notably below the reference (largest gap first). */
  lower: ComparisonDelta[];
}

/**
 * Notable differences between the user and a reference profile, used to build
 * the interpretation sentence. Only differences of at least `threshold` points
 * count, and at most `limit` are returned per direction.
 */
export function describeComparison(
  user: BiasScores,
  reference: BiasScores,
  biases: BiasAxis[],
  { threshold = 2, limit = 2 }: { threshold?: number; limit?: number } = {},
): ComparisonSummary {
  const deltas: ComparisonDelta[] = biases.map(({ name }) => ({
    bias: name,
    delta: (user[name] ?? 0) - (reference[name] ?? 0),
  }));

  const higher = deltas
    .filter((d) => d.delta >= threshold)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, limit);

  const lower = deltas
    .filter((d) => d.delta <= -threshold)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, limit);

  return { higher, lower };
}

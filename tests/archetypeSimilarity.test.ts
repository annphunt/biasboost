import { describe, it, expect } from "vitest";
import {
  similarityPercent,
  rankArchetypes,
  closestArchetype,
  describeComparison,
} from "../app/archetypes/similarity";
import { FOUNDER_CATEGORY } from "../app/archetypes/founderArchetypes";
import type { BiasScores } from "../app/archetypes/types";

const { biases, scoreMax } = FOUNDER_CATEGORY;
const visionary = FOUNDER_CATEGORY.archetypes.find((a) => a.id === "visionary")!;
const protector = FOUNDER_CATEGORY.archetypes.find(
  (a) => a.id === "operational-protector",
)!;

/** Build a full BiasScores map from a single constant value. */
function flat(value: number): BiasScores {
  return Object.fromEntries(biases.map((b) => [b.name, value]));
}

describe("similarityPercent", () => {
  it("returns 100 for identical profiles", () => {
    expect(
      similarityPercent(
        visionary.referenceScores,
        visionary.referenceScores,
        biases,
        scoreMax,
      ),
    ).toBe(100);
  });

  it("returns 0 for maximally opposite profiles", () => {
    expect(similarityPercent(flat(0), flat(scoreMax), biases, scoreMax)).toBe(0);
  });

  it("returns 50 when every bias differs by half the scale", () => {
    expect(similarityPercent(flat(0), flat(scoreMax / 2), biases, scoreMax)).toBe(50);
  });

  it("clamps out-of-range user scores rather than going negative", () => {
    const result = similarityPercent(flat(scoreMax * 2), flat(0), biases, scoreMax);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it("guards against empty inputs", () => {
    expect(similarityPercent(flat(6), flat(6), [], scoreMax)).toBe(0);
  });
});

describe("rankArchetypes / closestArchetype", () => {
  it("ranks archetypes by similarity, highest first", () => {
    const ranked = rankArchetypes(visionary.referenceScores, FOUNDER_CATEGORY);
    expect(ranked).toHaveLength(FOUNDER_CATEGORY.archetypes.length);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].similarity).toBeGreaterThanOrEqual(ranked[i].similarity);
    }
  });

  it("picks the archetype the user most resembles", () => {
    // A user whose scores are the visionary reference (nudged by 1) is closest
    // to the Visionary Founder profile.
    const nudged: BiasScores = Object.fromEntries(
      Object.entries(visionary.referenceScores).map(([k, v]) => [k, v + 1]),
    );
    expect(closestArchetype(nudged, FOUNDER_CATEGORY)?.archetype.id).toBe("visionary");
  });

  it("returns null for a category with no archetypes", () => {
    expect(
      closestArchetype(flat(6), { ...FOUNDER_CATEGORY, archetypes: [] }),
    ).toBeNull();
  });
});

describe("describeComparison", () => {
  it("flags biases where the user notably exceeds / trails the reference", () => {
    // Start from the visionary reference, then push Loss Aversion up and
    // Overconfidence down so each direction has a clear standout.
    const user: BiasScores = { ...visionary.referenceScores };
    user["Loss Aversion"] = visionary.referenceScores["Loss Aversion"] + 5;
    user["Overconfidence Bias"] = visionary.referenceScores["Overconfidence Bias"] - 5;

    const summary = describeComparison(user, visionary.referenceScores, biases);
    expect(summary.higher.map((d) => d.bias)).toContain("Loss Aversion");
    expect(summary.lower.map((d) => d.bias)).toContain("Overconfidence Bias");
  });

  it("ignores differences below the threshold", () => {
    const user: BiasScores = { ...protector.referenceScores };
    user["Halo Effect"] = protector.referenceScores["Halo Effect"] + 1; // < default threshold of 2
    const summary = describeComparison(user, protector.referenceScores, biases);
    expect(summary.higher).toHaveLength(0);
    expect(summary.lower).toHaveLength(0);
  });

  it("returns at most `limit` biases per direction", () => {
    const summary = describeComparison(flat(scoreMax), flat(0), biases, { limit: 2 });
    expect(summary.higher.length).toBeLessThanOrEqual(2);
  });
});

describe("dataset integrity", () => {
  it("every archetype has a reference score for every bias", () => {
    for (const a of FOUNDER_CATEGORY.archetypes) {
      for (const bias of biases) {
        const v = a.referenceScores[bias.name];
        expect(typeof v, `${a.name} → ${bias.name}`).toBe("number");
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(scoreMax);
      }
    }
  });
});

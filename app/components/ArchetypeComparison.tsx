"use client";

// Reusable Archetype Comparison section.
//
// This component is domain-agnostic: it knows nothing about founders. Give it
// the user's bias scores and any `ArchetypeCategory` dataset and it renders the
// selector, a grouped bar chart, a similarity score and an interpretation
// panel — driven entirely by the data. Future categories (Executive, Trader,
// Investor…) work here unchanged.

import { useMemo, useState } from "react";
import type { ArchetypeCategory, BiasScores } from "../archetypes/types";
import {
  closestArchetype,
  describeComparison,
  rankArchetypes,
  type ComparisonSummary,
} from "../archetypes/similarity";

interface ArchetypeComparisonProps {
  /** User's score (0..scoreMax) for each bias in the category. */
  userScores: BiasScores;
  category: ArchetypeCategory;
}

/** "A", "A and B", "A, B and C". */
function joinBiasNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** An interpretation of the comparison — deliberately not framed as fact. */
function buildComparisonSentence(summary: ComparisonSummary): string {
  const higher = joinBiasNames(summary.higher.map((d) => d.bias));
  const lower = joinBiasNames(summary.lower.map((d) => d.bias));

  if (!higher && !lower) {
    return "Your results track this reference profile closely, with no single bias standing out as notably higher or lower.";
  }

  const parts: string[] = [];
  if (higher) parts.push(`higher ${higher}`);
  if (lower) parts.push(`lower ${lower}`);

  return `Compared with this reference profile, your results suggest ${parts.join(
    " and ",
  )} than is typical of it — an interpretation of the comparison, not a fixed trait.`;
}

export default function ArchetypeComparison({
  userScores,
  category,
}: ArchetypeComparisonProps) {
  const ranked = useMemo(
    () => rankArchetypes(userScores, category),
    [userScores, category],
  );
  const closest = useMemo(
    () => closestArchetype(userScores, category),
    [userScores, category],
  );

  // Default selection is the closest-matching archetype.
  const [selectedId, setSelectedId] = useState(
    () => closest?.archetype.id ?? category.archetypes[0]?.id,
  );

  const selected =
    ranked.find((r) => r.archetype.id === selectedId) ?? ranked[0];

  if (!selected) return null; // empty dataset — nothing to compare

  const archetype = selected.archetype;
  const similarity = selected.similarity;
  const isClosest = archetype.id === closest?.archetype.id;

  const comparison = describeComparison(
    userScores,
    archetype.referenceScores,
    category.biases,
  );
  const comparisonSentence = buildComparisonSentence(comparison);

  const categoryLabel = category.name;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="space-y-1.5">
        <h2 className="text-xl font-semibold text-slate-800">
          {categoryLabel} Archetype Comparison
        </h2>
        <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
          Compare your cognitive profile with common {categoryLabel.toLowerCase()}{" "}
          decision-making archetypes. These are reference cognitive patterns, not
          personality types — your results are compared against them, never
          assigned.
        </p>
      </header>

      {/* Selector */}
      <div
        role="group"
        aria-label={`${categoryLabel} archetypes`}
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      >
        {ranked.map(({ archetype: a, similarity: s }) => {
          const active = a.id === selectedId;
          return (
            <button
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              aria-pressed={active}
              className={[
                "rounded-xl border px-3 py-2.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2",
                active
                  ? "border-teal-400 bg-teal-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-teal-300",
              ].join(" ")}
            >
              <span
                className={[
                  "block text-sm font-medium leading-snug",
                  active ? "text-teal-800" : "text-slate-700",
                ].join(" ")}
              >
                {a.name}
              </span>
              <span className="block text-xs text-slate-400 tabular-nums mt-0.5">
                {s}% match
              </span>
            </button>
          );
        })}
      </div>

      {/* Chart + similarity */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
        {/* Legend + similarity */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-teal-500" />
              You
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-400" />
              {archetype.name}
            </span>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-600">
              Similarity
            </p>
            <p className="text-3xl font-bold text-slate-800 tabular-nums leading-none">
              {similarity}%
            </p>
          </div>
        </div>

        {/* Grouped bar chart */}
        <div className="pl-7 pr-1">
          <div className="relative h-52">
            {/* gridlines + y-axis labels */}
            {ticks.map((f) => (
              <div
                key={f}
                className="absolute inset-x-0 border-t border-slate-100"
                style={{ bottom: `${f * 100}%` }}
              >
                <span className="absolute -left-7 -translate-y-1/2 text-[10px] text-slate-400 tabular-nums">
                  {Math.round(f * category.scoreMax)}
                </span>
              </div>
            ))}

            {/* bars */}
            <div className="absolute inset-0 flex items-end gap-1 sm:gap-2">
              {category.biases.map((bias) => {
                const u = userScores[bias.name] ?? 0;
                const r = archetype.referenceScores[bias.name] ?? 0;
                const uPct = Math.min(100, (u / category.scoreMax) * 100);
                const rPct = Math.min(100, (r / category.scoreMax) * 100);
                return (
                  <div
                    key={bias.name}
                    className="flex-1 h-full flex items-end justify-center gap-[3px]"
                  >
                    <div
                      title={`You — ${bias.name}: ${u}`}
                      style={{ height: `${uPct}%` }}
                      className="w-2.5 sm:w-3 rounded-t bg-teal-500 transition-[height] duration-500 ease-out"
                    />
                    <div
                      title={`${archetype.name} — ${bias.name}: ${r}`}
                      style={{ height: `${rPct}%` }}
                      className="w-2.5 sm:w-3 rounded-t bg-slate-400 transition-[height] duration-500 ease-out"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* x-axis labels */}
          <div className="flex gap-1 sm:gap-2 mt-2">
            {category.biases.map((bias) => (
              <div
                key={bias.name}
                title={bias.name}
                className="flex-1 text-center text-[9px] sm:text-[10px] leading-tight text-slate-500"
              >
                {bias.short}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interpretation panel */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            {isClosest ? `Closest ${categoryLabel} Archetype` : "Selected reference profile"}
          </p>
          {isClosest && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-700 bg-teal-100 rounded-full px-2 py-0.5">
              Closest match
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-3 flex-wrap">
          <h3 className="text-2xl font-bold text-slate-800">{archetype.name}</h3>
          <span className="text-sm font-medium text-slate-500 tabular-nums">
            {similarity}% similarity
          </span>
        </div>

        <p className="text-slate-600 leading-relaxed">{archetype.shortDescription}</p>
        <p className="text-slate-600 leading-relaxed">{comparisonSentence}</p>

        <div className="grid sm:grid-cols-2 gap-4 pt-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-1.5">
              Typical strengths
            </p>
            <ul className="space-y-1">
              {archetype.strengths.map((s) => (
                <li key={s} className="text-sm text-slate-600 flex gap-2">
                  <span className="text-emerald-500 flex-none">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1.5">
              Watch-outs
            </p>
            <ul className="space-y-1">
              {archetype.risks.map((r) => (
                <li key={r} className="text-sm text-slate-600 flex gap-2">
                  <span className="text-amber-500 flex-none">!</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-600 mb-1">
            Coaching takeaway
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            {archetype.coachingSummary}
          </p>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed pt-1">
          Illustrative comparison against a reference profile only. Not a
          personality result, diagnosis or statistical measure.
        </p>
      </div>
    </section>
  );
}

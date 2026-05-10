"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";


type Level = "Low" | "Medium" | "High";

const LEVEL_BG: Record<Level, string> = {
  Low:    "bg-green-500",
  Medium: "bg-amber-500",
  High:   "bg-red-500",
};

const BIAS_ICON: Record<string, string> = {
  "Confirmation Bias":      "/icons/confirmation-bias.png",
  "Anchoring Bias":         "/icons/anchoring-bias.png",
  "Availability Heuristic": "/icons/availability-heuristic.png",
  "Overconfidence Bias":    "/icons/overconfidence-bias.png",
  "Loss Aversion":          "/icons/loss-aversion.png",
  "Sunk Cost Fallacy":      "/icons/sunk-cost-fallacy.png",
  "Halo Effect":            "/icons/halo-effect.png",
  "Framing Effect":         "/icons/framing-effect.png",
  "Status Quo Bias":        "/icons/status-quo-bias.png",
  "Dunning-Kruger Effect":  "/icons/dunning-kruger-effect.png",
};

interface BiasCard {
  name: string;
  description: string;
  completed: boolean;
  attemptId: number | null;
  level: Level | null;
}

function PlaceholderIcon() {
  return (
    <svg viewBox="0 0 96 96" fill="none" className="w-full h-full" aria-hidden="true">
      {/* Outer ring */}
      <circle cx="48" cy="48" r="44" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 3" />
      {/* Inner disc */}
      <circle cx="48" cy="48" r="32" fill="#f1f5f9" />
      {/* Question mark stem */}
      <path
        d="M48 56v-2c0-3 1.5-5 4.5-7.5C55 44 56 42 56 39.5 56 35.4 52.4 32 48 32s-8 3.4-8 7.5"
        stroke="#94a3b8"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Question mark dot */}
      <circle cx="48" cy="62" r="2.5" fill="#94a3b8" />
    </svg>
  );
}

export default function BiasMenuPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  const [biases, setBiases] = useState<BiasCard[]>([]);
  const [loadingBias, setLoadingBias] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/users/${userId}/biases`)
      .then((r) => r.json())
      .then((data) => setBiases(data.biases ?? []));
  }, [userId]);

  async function startBias(biasName: string) {
    setLoadingBias(biasName);
    setError(null);
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), bias: biasName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start");
      router.push(`/quiz/${data.attemptId}?userId=${userId}`);
    } catch (err) {
      setError(String(err));
      setLoadingBias(null);
    }
  }

  const completedCount = biases.filter((b) => b.completed).length;
  const pct = biases.length === 0 ? 0 : Math.round((completedCount / 10) * 100);
  const firstIncomplete = biases.find((b) => !b.completed) ?? null;
  const allComplete = biases.length === 10 && biases.every((b) => b.completed);

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-5 bg-teal-500 rounded-sm" />
            <span className="text-sm font-semibold text-slate-800">BiasBoost</span>
          </div>
          <span className="text-xs text-slate-400">User #{userId}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 py-12 space-y-8">

        {/* Progress header */}
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <span className="text-6xl font-bold text-slate-800 leading-none">{pct}%</span>
            <span className="text-slate-400 text-sm mb-1 leading-snug">
              {completedCount} of 10<br />complete
            </span>
          </div>

          {biases.length > 0 && firstIncomplete && (
            <button
              onClick={() => startBias(firstIncomplete.name)}
              disabled={!!loadingBias}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {loadingBias === firstIncomplete.name ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Starting…
                </>
              ) : pct === 0 ? "Get started" : "Test a new bias"}
            </button>
          )}
        </div>

        {/* Intro text */}
        <p className="text-slate-500 text-sm leading-relaxed max-w-md">
          There are 10 cognitive biases to examine. Complete each module to reveal your
          bias profile — the topic stays hidden until you finish.
        </p>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Icon grid skeleton */}
        {biases.length === 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Icon grid */}
        {biases.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
            {biases.map((bias) => {
              const isLoading = loadingBias === bias.name;
              const isDisabled = !!loadingBias && !bias.completed;
              const bgClass = bias.completed
                ? (bias.level ? LEVEL_BG[bias.level] : "bg-teal-500")
                : "bg-white border border-slate-200";
              const iconSrc = BIAS_ICON[bias.name];

              return (
                <div key={bias.name} className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => {
                      if (bias.completed && bias.attemptId !== null) {
                        router.push(`/analysis/${bias.attemptId}?userId=${userId}`);
                      } else {
                        startBias(bias.name);
                      }
                    }}
                    disabled={isDisabled}
                    aria-label={bias.completed ? `View ${bias.name} analysis` : `Start module`}
                    className={[
                      "w-24 h-24 rounded-2xl flex items-center justify-center transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 overflow-hidden",
                      bgClass,
                      bias.completed
                        ? "hover:opacity-90 hover:ring-2 hover:ring-offset-2 hover:ring-slate-300 focus:ring-teal-400"
                        : isDisabled
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:border-slate-300 hover:shadow-md cursor-pointer focus:ring-slate-300",
                    ].join(" ")}
                  >
                    {isLoading ? (
                      <svg className="animate-spin w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : bias.completed && iconSrc ? (
                      <Image
                        src={iconSrc}
                        alt={bias.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <PlaceholderIcon />
                    )}
                  </button>

                  {bias.completed && (
                    <div className="flex flex-col items-center gap-0.5 max-w-[96px]">
                      <span className="text-xs text-slate-600 font-medium text-center leading-tight">
                        {bias.name}
                      </span>
                      <span className="text-[10px] text-slate-400 text-center">
                        Tap to revisit →
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Contextual hint */}
        {completedCount > 0 && !allComplete && (
          <p className="text-xs text-slate-400 text-center">
            Tap any coloured module to revisit your analysis.
          </p>
        )}

        {/* All-complete banner */}
        {allComplete && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 text-emerald-700 text-sm">
            All 10 biases assessed. Tap any icon above to revisit your analysis.
          </div>
        )}

      </div>
    </main>
  );
}

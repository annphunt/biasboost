"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import UserBadge from "../components/UserBadge";

type Level = "Low" | "Medium" | "High";

const LEVEL_BG: Record<Level, string> = {
  Low:    "bg-green-500",
  Medium: "bg-amber-500",
  High:   "bg-red-500",
};
const LEVEL_DOT: Record<Level, string> = {
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

const TOTAL_QUESTIONS = 4;
const DURATION_LABEL = "4–6 min";

interface BiasCard {
  name: string;
  description: string;
  completed: boolean;
  inProgress: boolean;
  answered: number;
  attemptId: number | null;
  level: Level | null;
}

export default function DashboardPage() {
  const router = useRouter();

  const [biases, setBiases] = useState<BiasCard[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadingBias, setLoadingBias] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/me/biases`)
      .then((r) => {
        if (r.status === 401) { router.push("/"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setBiases(data.biases ?? []);
        setLoaded(true);
      });
  }, [router]);

  async function startBias(biasName: string) {
    setLoadingBias(biasName);
    setError(null);
    try {
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bias: biasName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Failed to start");
      router.push(`/quiz/${data.attemptId}`);
    } catch (err) {
      setError(String(err));
      setLoadingBias(null);
    }
  }

  function openAnalysis(bias: BiasCard) {
    router.push(`/analysis/${bias.attemptId}?bias=${encodeURIComponent(bias.name)}`);
  }

  const completedCount = biases.filter((b) => b.completed).length;
  const total = biases.length || 10;
  const pct = Math.round((completedCount / total) * 100);
  const nextIndex = biases.findIndex((b) => !b.completed);
  const nextBias = nextIndex >= 0 ? biases[nextIndex] : null;
  const allComplete = loaded && biases.length > 0 && !nextBias;

  const ctaLabel = allComplete
    ? "Review Your Results →"
    : completedCount === 0
    ? "Start First Boost →"
    : "Start Next Boost →";

  function handlePrimary() {
    if (allComplete) {
      document.getElementById("boosts")?.scrollIntoView({ behavior: "smooth" });
    } else if (nextBias) {
      startBias(nextBias.name);
    }
  }

  const ctaBusy = !!nextBias && loadingBias === nextBias.name;

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/biases" className="flex items-center hover:opacity-70 transition-opacity">
            <Image src="/logo-mark.png" alt="BiasBoost" width={32} height={32} className="h-8 w-auto" />
          </a>
          <div className="flex items-center gap-4">
            <a
              href="/settings"
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              Settings
            </a>
            <UserBadge />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 py-12 space-y-10">

        {/* 1. Welcome area */}
        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800 leading-tight text-balance">
            Start building better judgement.
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed max-w-xl">
            Each Boost explores a different hidden thinking pattern. Complete them in
            any order and discover the bias only after you&apos;ve made your judgement.
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* 2. Primary action — visually dominant */}
        <section className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-6 sm:p-7 shadow-sm">
          <button
            onClick={handlePrimary}
            disabled={!loaded || ctaBusy}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-base tracking-wide transition-colors shadow-sm"
          >
            {ctaBusy ? "Opening…" : loaded ? ctaLabel : "Loading…"}
          </button>
          {!allComplete && (
            <p className="text-sm text-slate-500 mt-3">About {DURATION_LABEL}</p>
          )}
          {allComplete && (
            <p className="text-sm text-emerald-700 mt-3">
              All {total} Boosts complete — revisit any below.
            </p>
          )}
        </section>

        {/* 3. Progress */}
        <section className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              {completedCount} of {total} completed
            </span>
            <span className="text-slate-400 tabular-nums">{pct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </section>

        {/* 4. Calibration Score */}
        <section className="rounded-xl border border-slate-200 bg-slate-50/60 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
              Calibration Score
            </p>
            <p className="text-sm font-medium text-slate-700 mt-1.5">Not implemented yet.</p>
            <p className="text-sm text-slate-400 mt-0.5 max-w-sm leading-snug">
              Complete your first Boost to begin building a picture of how
              well-calibrated your judgement is over time.
            </p>
          </div>
          <span className="text-4xl font-bold text-slate-300 leading-none">—</span>
        </section>

        {/* 5. Boost grid */}
        <section id="boosts" className="space-y-4 scroll-mt-20">
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold text-slate-800">Your Boosts</h2>
            <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
              10 Boosts, each revealing a different hidden thinking pattern. Choose any
              unopened Boost, or use “{completedCount === 0 ? "Start First" : "Start Next"} Boost”
              above.
            </p>
          </div>

          {!loaded ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-slate-100 border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {biases.map((bias, i) => (
                <BoostCard
                  key={bias.name}
                  bias={bias}
                  number={i + 1}
                  busy={loadingBias === bias.name}
                  disabled={!!loadingBias && loadingBias !== bias.name}
                  onOpen={() => (bias.completed ? openAnalysis(bias) : startBias(bias.name))}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function BoostCard({
  bias, number, busy, disabled, onOpen,
}: {
  bias: BiasCard;
  number: number;
  busy: boolean;
  disabled: boolean;
  onOpen: () => void;
}) {
  const iconSrc = BIAS_ICON[bias.name];
  const label = bias.completed
    ? `Review ${bias.name} — Boost ${number}`
    : bias.inProgress
    ? `Resume Boost ${number}`
    : `Start Boost ${number}`;

  return (
    <button
      onClick={onOpen}
      disabled={disabled}
      aria-label={label}
      className={[
        "group relative w-full min-h-[7rem] rounded-xl border p-3.5 flex flex-col text-left transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:shadow-md",
        bias.completed
          ? "border-slate-200 bg-white hover:border-slate-300"
          : bias.inProgress
          ? "border-teal-200 bg-teal-50 hover:border-teal-300"
          : "border-slate-200 bg-white hover:border-teal-300",
      ].join(" ")}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        Boost {number}
      </span>

      {busy ? (
        <div className="flex-1 flex items-center justify-center">
          <svg className="animate-spin w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      ) : bias.completed ? (
        <div className="flex-1 flex flex-col justify-between mt-1">
          <div className="flex items-start gap-2">
            {iconSrc && (
              <Image src={iconSrc} alt="" width={32} height={32} className="w-8 h-8 object-contain flex-none" />
            )}
            <span className="text-sm font-medium text-slate-800 leading-snug">{bias.name}</span>
          </div>
          {bias.level && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 mt-2">
              <span className={`w-2 h-2 rounded-full ${LEVEL_DOT[bias.level]}`} />
              {bias.level}
            </span>
          )}
        </div>
      ) : bias.inProgress ? (
        <div className="flex-1 flex flex-col justify-center">
          <span className="text-lg font-bold text-teal-700">
            {bias.answered}/{TOTAL_QUESTIONS}
          </span>
          <span className="text-xs font-medium text-teal-600">In progress</span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center">
          <span className="text-base font-semibold text-slate-700">Hidden</span>
          <span className="text-xs text-slate-400 mt-0.5">{DURATION_LABEL}</span>
        </div>
      )}
    </button>
  );
}

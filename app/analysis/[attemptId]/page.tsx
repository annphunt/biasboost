"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

type Level = "Low" | "Medium" | "High";

const BIAS_DEFINITIONS: Record<string, string> = {
  "Confirmation Bias": "Confirmation bias is the tendency to search for, favour, and recall information that supports your existing beliefs — while unconsciously discounting evidence that challenges them. It's not stubbornness; it's an automatic mental shortcut that affects even the most analytical thinkers. The result is that your views feel increasingly well-supported over time, even when the underlying evidence is mixed.",
  "Anchoring Bias": "Anchoring bias is the tendency to rely too heavily on the first piece of information you receive when making a decision. That initial number, estimate, or framing — the anchor — shapes all your subsequent thinking, even when it's arbitrary or shouldn't be relevant. It's why the opening offer in a negotiation matters so much, and why first impressions are so hard to revise.",
  "Availability Heuristic": "The availability heuristic is the tendency to judge how likely or common something is based on how easily an example comes to mind. Because recent, dramatic, or emotionally vivid events are easier to recall, we overestimate their frequency and probability. This is why people overestimate the risk of plane crashes and underestimate everyday hazards — the dramatic examples are simply more memorable.",
  "Overconfidence Bias": "Overconfidence bias is the tendency to overestimate the accuracy of your own knowledge, forecasts, and abilities. Most people — including domain experts — believe their judgements are more reliable than they actually are. It manifests as overly narrow confidence intervals, underestimated timelines, and a tendency to act on conviction before the evidence warrants it.",
  "Loss Aversion": "Loss aversion is the tendency to feel the pain of losing something roughly twice as intensely as the pleasure of gaining something equivalent. It's not irrational to dislike losses — but when losses loom disproportionately large, they distort decisions: we hold onto failing positions too long, avoid necessary risks, and accept worse expected outcomes just to avoid the possibility of loss.",
  "Sunk Cost Fallacy": "The sunk cost fallacy is the tendency to continue investing time, money, or effort into something because of what has already been spent — rather than based on its future prospects. Past costs are unrecoverable regardless of what you do next. Yet they continue to pull decisions forward, turning what should be a forward-looking question into an emotional defence of past choices.",
  "Halo Effect": "The halo effect is the tendency to let one positive impression of a person, brand, or idea colour your overall judgement of them. Attractiveness, confidence, or early success in one domain leads us to assume competence and virtue in unrelated areas. It's why charismatic leaders often escape scrutiny, and why strong first impressions are so difficult to revise even with contradictory evidence.",
  "Framing Effect": "The framing effect is the tendency to respond differently to the same information depending on how it's presented. A 90% survival rate and a 10% mortality rate are identical facts — but they don't feel the same. Whether data is framed as a gain or a loss, a percentage or a raw number, a risk or an opportunity, it meaningfully shifts the decisions that follow.",
  "Status Quo Bias": "Status quo bias is a preference for the current state of affairs, leading people to resist change even when an alternative would be objectively better. The default option carries disproportionate weight simply because it's familiar and because any change introduces perceived risk. It's why organisations persist with outdated processes, and why 'do nothing' is so often the implicit winner in decisions.",
  "Dunning-Kruger Effect": "The Dunning-Kruger effect describes how people with limited knowledge in a domain tend to overestimate their competence — while genuine experts often underestimate theirs. The core problem is metacognitive: the less you know, the less equipped you are to recognise what you don't know. It's why novices act with great confidence and why mastery tends to produce more caution, not less.",
};

const LEVEL_STYLES: Record<Level, { badge: string; bar: string }> = {
  Low:    { badge: "bg-green-500 text-white border-green-500",   bar: "bg-green-500" },
  Medium: { badge: "bg-amber-500 text-white border-amber-500",   bar: "bg-amber-500" },
  High:   { badge: "bg-red-500 text-white border-red-500",       bar: "bg-red-500"   },
};

function levelFromScore(score: number): Level {
  if (score <= 4) return "Low";
  if (score <= 8) return "Medium";
  return "High";
}

type StepState = "pending" | "loading" | "done";

function StepIndicator({ steps }: { steps: { label: string; state: StepState }[] }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
              step.state === "done"
                ? "bg-teal-500"
                : step.state === "loading"
                ? "bg-teal-100 border-2 border-teal-400"
                : "bg-slate-100 border-2 border-slate-200"
            }`}>
              {step.state === "done" ? (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : step.state === "loading" ? (
                <svg className="animate-spin w-3 h-3 text-teal-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              )}
            </div>
            <span className={`text-[10px] font-medium transition-colors duration-300 whitespace-nowrap ${
              step.state === "done" ? "text-teal-600"
                : step.state === "loading" ? "text-teal-500"
                : "text-slate-300"
            }`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-16 sm:w-24 h-px mb-5 mx-1 transition-colors duration-500 ${
              steps[i + 1].state !== "pending" ? "bg-teal-300" : "bg-slate-200"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

function renderText(text: string) {
  return text
    .split(/\n\n+/)
    .filter((p) => p.trim())
    .map((para, i) => {
      const parts = para.trim().split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, j) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={j}>{part.slice(2, -2)}</strong>
        ) : (
          part
        )
      );
      return (
        <p key={i} className="text-slate-600 leading-relaxed">
          {rendered}
        </p>
      );
    });
}

export default function AnalysisPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const router = useRouter();

  // Bias name + definition from URL param — renders instantly, no API wait
  const biasFromUrl = searchParams.get("bias") ?? "";
  const definitionFromUrl = BIAS_DEFINITIONS[biasFromUrl] ?? "";

  const [meta, setMeta] = useState<{ totalScore: number; level: Level; bias: string; definition: string } | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [summary, setSummary] = useState("");
  const [summaryDone, setSummaryDone] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animated score counter — counts from 0 to final score over ~1.5s
  useEffect(() => {
    if (!meta || meta.totalScore === 0) {
      setDisplayScore(meta?.totalScore ?? 0);
      return;
    }
    const duration = 1500;
    const stepInterval = duration / meta.totalScore;
    let current = 0;
    const timer = setInterval(() => {
      current++;
      setDisplayScore(current);
      if (current >= meta.totalScore) clearInterval(timer);
    }, stepInterval);
    return () => clearInterval(timer);
  }, [meta]);

  const displayLevel = levelFromScore(displayScore);

  // Step states — step2 is "loading" immediately since analysis starts on page load
  const step1: StepState = definitionFromUrl ? "done" : "pending";
  const step2: StepState = summaryDone ? "done" : "loading";
  const step3: StepState = !summaryDone ? "pending" : detail ? "done" : "loading";

  // Auto-load detail once summary is done
  useEffect(() => {
    if (!summaryDone) return;
    let cancelled = false;

    async function pollDetail() {
      setLoadingDetail(true);
      for (let i = 0; i < 15; i++) {
        if (cancelled) return;
        try {
          const res = await fetch(`/api/attempts/${attemptId}/analysis/detail`);
          if (res.status === 202) {
            await new Promise((r) => setTimeout(r, 4000));
            continue;
          }
          if (!res.ok) break;
          const data = await res.json();
          if (!cancelled) setDetail(data.detail);
          break;
        } catch {
          break;
        }
      }
      if (!cancelled) setLoadingDetail(false);
    }

    pollDetail();
    return () => { cancelled = true; };
  }, [summaryDone, attemptId]);

  // Load analysis (streaming or cached)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/attempts/${attemptId}/analysis`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail ?? data.error ?? "Failed to load analysis");
        }

        const contentType = res.headers.get("Content-Type") ?? "";

        if (contentType.includes("application/json")) {
          const data = await res.json();
          setMeta({ totalScore: data.totalScore, level: data.level, bias: data.bias, definition: data.definition ?? "" });
          setSummary(data.summary);
          setSummaryDone(true);
          return;
        }

        // Streaming path
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let metaParsed = false;
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;

          buffer += decoder.decode(value, { stream: true });

          if (!metaParsed && buffer.includes("\n")) {
            const newlineIdx = buffer.indexOf("\n");
            const firstLine = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);

            if (firstLine.startsWith("__META__")) {
              const parsed = JSON.parse(firstLine.slice(8));
              setMeta(parsed);
              metaParsed = true;
            }
          }

          if (metaParsed && buffer.length > 0) {
            fullText += buffer;
            setSummary(fullText);
            buffer = "";
          }
        }

        if (buffer.length > 0) {
          fullText += buffer;
          setSummary(fullText);
        }

        if (!cancelled) setSummaryDone(true);
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const biasName = biasFromUrl || meta?.bias || "";

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/biases/${userId}`)}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1 mr-3"
            >
              ← Back
            </button>
            <a href="/" className="flex items-center hover:opacity-70 transition-opacity">
              <Image src="/logo.png" alt="BiasBoost" width={82} height={28} className="h-7 w-auto" />
            </a>
            <span className="ml-2 text-xs text-slate-400">Analysis</span>
          </div>
          <span className="text-xs text-slate-400">User #{userId}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-10 space-y-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Score card — always at top, skeleton until meta loads */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-1">
                Bias Assessed
              </p>
              <h2 className="text-xl font-semibold text-slate-800">
                {biasName || "…"}
              </h2>
            </div>
            {meta ? (
              <span className={`flex-shrink-0 inline-flex items-center text-sm font-semibold border rounded-full px-3 py-1 transition-colors duration-300 ${LEVEL_STYLES[displayLevel].badge}`}>
                {displayLevel}
              </span>
            ) : (
              <span className="flex-shrink-0 w-20 h-7 bg-slate-100 rounded-full animate-pulse" />
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Score: {meta ? `${displayScore} / 12` : "— / 12"}</span>
              <span className="flex gap-3">
                <span className="text-green-600">Low 0–4</span>
                <span className="text-amber-600">Medium 5–8</span>
                <span className="text-red-600">High 9–12</span>
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-200 ${meta ? LEVEL_STYLES[displayLevel].bar : "bg-slate-200"}`}
                style={{ width: meta ? `${(displayScore / 12) * 100}%` : "0%" }}
              />
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex justify-center py-1">
          <StepIndicator steps={[
            { label: "Bias explained", state: step1 },
            { label: "Your score",     state: step2 },
            { label: "Your responses", state: step3 },
          ]} />
        </div>

        {/* Definition — shown once, instantly from URL param */}
        {definitionFromUrl && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
              What is {biasName}?
            </p>
            <p className="text-slate-600 leading-relaxed">{definitionFromUrl}</p>
          </div>
        )}

        {/* Inline status 1 — shown immediately, removed when summary arrives */}
        {!summaryDone && (
          <div className="flex items-center gap-3 text-slate-400 text-sm px-1">
            <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Now analysing what this score means…
          </div>
        )}

        {/* Score summary — header always shown, skeleton until text arrives */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
            What does your score mean?
          </p>
          {summary ? (
            <>
              {renderText(summary)}
              {!summaryDone && (
                <span className="inline-block w-1 h-4 bg-teal-500 animate-pulse rounded-sm ml-1" />
              )}
            </>
          ) : (
            <div className="space-y-2">
              <div className="h-3 bg-slate-100 rounded animate-pulse w-full" />
              <div className="h-3 bg-slate-100 rounded animate-pulse w-4/5" />
              <div className="h-3 bg-slate-100 rounded animate-pulse w-3/5" />
            </div>
          )}
        </div>

        {/* Inline status 2 — shown when summary done but detail not yet ready */}
        {summaryDone && loadingDetail && !detail && (
          <div className="flex items-center gap-3 text-slate-400 text-sm px-1">
            <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Now generating more detail on your specific responses…
          </div>
        )}

        {/* Detail — auto-loads after summary done */}
        {detail && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              In your responses
            </p>
            {renderText(detail)}
          </div>
        )}

      </div>
    </main>
  );
}

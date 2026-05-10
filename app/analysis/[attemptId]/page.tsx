"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

type Level = "Low" | "Medium" | "High";

const LEVEL_STYLES: Record<Level, { badge: string; bar: string }> = {
  Low:    { badge: "bg-green-500 text-white border-green-500",   bar: "bg-green-500" },
  Medium: { badge: "bg-amber-500 text-white border-amber-500",   bar: "bg-amber-500" },
  High:   { badge: "bg-red-500 text-white border-red-500",       bar: "bg-red-500"   },
};

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

  const [meta, setMeta] = useState<{ totalScore: number; level: Level; bias: string } | null>(null);
  const [summary, setSummary] = useState("");
  const [summaryDone, setSummaryDone] = useState(false);
  const [hasDetail, setHasDetail] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/attempts/${attemptId}/analysis`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to load analysis");
        }

        const contentType = res.headers.get("Content-Type") ?? "";

        // Cached path — instant JSON
        if (contentType.includes("application/json")) {
          const data = await res.json();
          setMeta({ totalScore: data.totalScore, level: data.level, bias: data.bias });
          setSummary(data.summary);
          setSummaryDone(true);
          setHasDetail(data.hasDetail);
          setLoading(false);
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
              setLoading(false);
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
        if (!cancelled) {
          setError(String(err));
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  async function loadDetail() {
    setLoadingDetail(true);
    let attempts = 0;
    const maxAttempts = 12; // poll up to ~60s

    while (attempts < maxAttempts) {
      try {
        const res = await fetch(`/api/attempts/${attemptId}/analysis/detail`);
        if (res.status === 202) {
          // Not ready yet — wait and retry
          await new Promise((r) => setTimeout(r, 5000));
          attempts++;
          continue;
        }
        if (!res.ok) throw new Error("Failed to load detail");
        const data = await res.json();
        setDetail(data.detail);
        setLoadingDetail(false);
        return;
      } catch {
        setLoadingDetail(false);
        return;
      }
    }
    setLoadingDetail(false);
  }

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
            <span className="inline-block w-1.5 h-5 bg-teal-500 rounded-sm" />
            <span className="text-sm font-semibold text-slate-800">BiasBoost</span>
            <span className="ml-2 text-xs text-slate-400">Analysis</span>
          </div>
          <span className="text-xs text-slate-400">User #{userId}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-12 space-y-8">

        {loading && !error && (
          <div className="flex items-center gap-3 text-slate-400">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Analysing your responses…
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {meta && (
          <>
            {/* Score card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-teal-600 mb-1">
                    Bias Assessed
                  </p>
                  <h2 className="text-xl font-semibold text-slate-800">{meta.bias}</h2>
                </div>
                <span className={`flex-shrink-0 inline-flex items-center text-sm font-semibold border rounded-full px-3 py-1 ${LEVEL_STYLES[meta.level].badge}`}>
                  {meta.level}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Score: {meta.totalScore} / 12</span>
                  <span className="flex gap-3">
                    <span className="text-green-600">Low 0–4</span>
                    <span className="text-amber-600">Medium 5–8</span>
                    <span className="text-red-600">High 9–12</span>
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${LEVEL_STYLES[meta.level].bar}`}
                    style={{ width: `${(meta.totalScore / 12) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            {summary && (() => {
              const paragraphs = summary.split(/\n\n+/).filter((p) => p.trim());
              const TITLES = [
                `${meta.bias} — Explained`,
                "What does my score mean for me?",
              ];
              return (
                <div className="space-y-6">
                  {paragraphs.map((para, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
                      {TITLES[i] && (
                        <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
                          {TITLES[i]}
                        </p>
                      )}
                      {renderText(para)}
                      {i === paragraphs.length - 1 && !summaryDone && (
                        <span className="inline-block w-1 h-4 bg-teal-500 animate-pulse rounded-sm ml-1" />
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* More info */}
            {summaryDone && !detail && (
              <div className="flex justify-center">
                <button
                  onClick={loadDetail}
                  disabled={loadingDetail}
                  className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  {loadingDetail ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Loading detail…
                    </>
                  ) : (
                    "Learn more →"
                  )}
                </button>
              </div>
            )}

            {/* Detail */}
            {detail && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  In your responses
                </p>
                {renderText(detail)}
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}

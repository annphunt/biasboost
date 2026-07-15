"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import UserBadge from "../../components/UserBadge";

interface Question {
  id: number;
  number: number;
  question: string;
  options: Record<string, string>;
  answer_given: string | null;
}

interface AttemptData {
  attempt: { id: number; userId: string; bias: string };
  questions: Question[];
  answeredCount: number;
  totalQuestions: number;
  isComplete: boolean;
}

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

export default function QuizPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const router = useRouter();

  const [data, setData] = useState<AttemptData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localAnswers, setLocalAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchAttempt = useCallback(async () => {
    const res = await fetch(`/api/attempts/${attemptId}`);
    if (res.status === 401) { router.push("/"); return; }
    if (!res.ok) return;
    const json: AttemptData = await res.json();
    setData(json);
    // Restore any already-saved answers into local state
    const saved: Record<number, string> = {};
    json.questions.forEach((q) => {
      if (q.answer_given) saved[q.number] = q.answer_given;
    });
    setLocalAnswers(saved);
    setCurrentIndex(0);
  }, [attemptId]);

  useEffect(() => {
    fetchAttempt();
  }, [fetchAttempt]);

  async function saveAnswer(questionNumber: number, answer: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/attempts/${attemptId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionNumber, answer }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleSelect(answer: string) {
    if (!data || saving) return;
    const currentQ = data.questions[currentIndex];
    const isLastQuestion = currentIndex === data.questions.length - 1;
    // Update local state immediately for snappy UX
    setLocalAnswers((prev) => ({ ...prev, [currentQ.number]: answer }));
    await saveAnswer(currentQ.number, answer);
    // Auto-advance to next question unless this is the last one
    if (!isLastQuestion) {
      setCurrentIndex((i) => i + 1);
    }
  }

  async function handleSubmit() {
    if (!data) return;
    setSubmitting(true);
    setError(null);
    try {
      const biasName = encodeURIComponent(data.attempt.bias);
      // replace (not push) so browser Back from the results screen returns to the
      // dashboard/status screen rather than re-opening the completed quiz.
      router.replace(`/analysis/${attemptId}?bias=${biasName}`);
    } catch (err) {
      setError(String(err));
      setSubmitting(false);
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading…
        </div>
      </div>
    );
  }

  const currentQ = data.questions[currentIndex];
  const totalQuestions = data.questions.length;

  // Guard: if attempt is complete or questions not yet available, send to analysis
  if (!currentQ || totalQuestions === 0) {
    router.replace(`/analysis/${attemptId}`);
    return null;
  }

  const answeredCount = Object.keys(localAnswers).length;
  const allAnswered = answeredCount === totalQuestions;
  const progress = (answeredCount / totalQuestions) * 100;
  const currentAnswer = localAnswers[currentQ.number] ?? null;

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/biases" className="flex items-center hover:opacity-70 transition-opacity">
              <Image src="/logo-mark.png" alt="BiasBoost" width={32} height={32} className="h-8 w-auto" />
            </a>
            <span className="ml-2 text-xs text-slate-400">Boost</span>
          </div>
          <UserBadge />
        </div>
        {/* Navigation row */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-sm font-medium hover:bg-teal-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>

          <div className="flex gap-1.5">
            {data.questions.map((q, i) => (
              <button
                key={q.number}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex
                    ? "bg-teal-500"
                    : localAnswers[q.number]
                    ? "bg-slate-400"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          {currentIndex < totalQuestions - 1 ? (
            <button
              onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
              className="px-4 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-sm font-medium hover:bg-teal-100 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting || saving}
              className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-slate-100">
          <div
            className="h-full bg-teal-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">

          {/* Progress label */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Question <span className="font-semibold text-slate-700">{currentIndex + 1}</span> of {totalQuestions}
            </span>
            <span>{answeredCount} of {totalQuestions} answered</span>
          </div>

          {/* Question card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
            <p className="text-lg text-slate-800 leading-relaxed font-medium">
              {currentQ.question}
            </p>

            <div className="space-y-3">
              {OPTION_LABELS.map((label) => {
                const text = currentQ.options[label];
                if (!text) return null;
                const isSelected = currentAnswer === label;

                return (
                  <button
                    key={label}
                    onClick={() => handleSelect(label)}
                    disabled={saving}
                    className={`w-full text-left flex gap-4 items-start px-5 py-4 rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? "border-teal-500 bg-teal-50 text-slate-800"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    } disabled:cursor-not-allowed`}
                  >
                    <span
                      className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold mt-0.5 ${
                        isSelected
                          ? "border-teal-500 bg-teal-500 text-white"
                          : "border-slate-300 text-slate-400"
                      }`}
                    >
                      {label}
                    </span>
                    <span className="text-sm leading-relaxed">{text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {!allAnswered && currentIndex === totalQuestions - 1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>
                You must answer all {totalQuestions} questions before submitting.
                Use the <strong>Previous</strong> button or the dots above to go back and complete any unanswered questions.
              </span>
            </div>
          )}

          {saving && (
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Saving…
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

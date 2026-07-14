"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import FocusCards from "../components/FocusCards";
import type { FocusSlug } from "../lib/focus";

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<FocusSlug | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selected }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail ?? "Could not save your choice. Please try again.");
      }
      router.push("/biases");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center">
          <Image src="/logo.png" alt="BiasBoost" width={82} height={28} className="h-7 w-auto" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-14">
        <div className="max-w-2xl w-full space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800 leading-tight text-balance">
              Where will you use BiasBoost most?
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed max-w-xl">
              Choose the context you would like your assessments to focus on. You can
              change this later in Settings.
            </p>
          </div>

          <FocusCards selected={selected} onSelect={setSelected} disabled={saving} />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <button
              onClick={handleContinue}
              disabled={!selected || saving}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm tracking-wide transition-colors"
            >
              {saving ? "Saving…" : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

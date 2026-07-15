"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import UserBadge from "../components/UserBadge";
import FocusCards from "../components/FocusCards";
import { focusLabel, type FocusSlug } from "../lib/focus";

export default function SettingsPage() {
  const router = useRouter();
  const [current, setCurrent] = useState<FocusSlug | null>(null);
  const [pending, setPending] = useState<FocusSlug | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => {
        if (r.status === 401) { router.push("/"); return null; }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setCurrent(d.role as FocusSlug);
        setPending(d.role as FocusSlug);
      });
  }, [router]);

  const changed = pending !== null && pending !== current;

  async function confirmSave() {
    if (!pending) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: pending }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail ?? "Could not save changes.");
      }
      router.push("/biases");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
      setConfirming(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/biases")}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              ← Back
            </button>
            <a href="/biases" className="flex items-center hover:opacity-70 transition-opacity">
              <Image src="/logo-mark.png" alt="BiasBoost" width={32} height={32} className="h-8 w-auto" />
            </a>
          </div>
          <UserBadge />
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 py-12 space-y-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Settings</h1>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-teal-600">Focus</h2>
            <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
              The context your Boosts are set in. Currently{" "}
              <span className="font-medium text-slate-700">{focusLabel(current)}</span>.
            </p>
          </div>

          {current === null ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-slate-100 border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : (
            <FocusCards selected={pending} onSelect={setPending} disabled={saving} />
          )}

          {changed && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Changing focus will permanently delete your current results.
            </p>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={() => setConfirming(true)}
            disabled={!changed || saving}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            Save changes
          </button>
        </section>
      </div>

      {confirming && pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl leading-none">⚠️</div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-800">
                  Switch focus to {focusLabel(pending)}?
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  This will <span className="font-semibold text-slate-700">permanently delete
                  all your current results</span> — every Boost you&apos;ve completed and
                  its analysis. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setConfirming(false)}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {saving ? "Switching…" : "Switch & delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

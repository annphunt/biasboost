"use client";

import { useEffect, useState } from "react";

type Role = "entrepreneur" | "trader" | "executive";

const ROLES: Role[] = ["entrepreneur", "trader", "executive"];

const LABEL: Record<Role, string> = {
  entrepreneur: "Entrepreneur",
  trader: "Trader",
  executive: "Executive",
};

export default function PersonaToggle() {
  const [role, setRole] = useState<Role | null>(null);
  const [pending, setPending] = useState<Role | null>(null);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setRole(d.role as Role));
  }, []);

  if (!role) return null;

  async function confirmSwitch() {
    if (!pending) return;
    setSwitching(true);
    setError(null);
    try {
      const res = await fetch("/api/me/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: pending }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? "Failed to switch persona");
      }
      // Destructive reset — reload so the (now-empty) grid and new persona
      // are reflected everywhere.
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSwitching(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 hidden sm:inline">Testing as</span>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
          {ROLES.map((r, i) => (
            <button
              key={r}
              onClick={() => r !== role && setPending(r)}
              aria-pressed={r === role}
              className={`px-2.5 py-1.5 transition-colors ${
                r === role
                  ? "bg-teal-600 text-white cursor-default"
                  : "bg-white text-slate-500 hover:bg-slate-50"
              } ${i > 0 ? "border-l border-slate-200" : ""}`}
            >
              {LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl leading-none">⚠️</div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-slate-800">
                  Switch to {LABEL[pending]}?
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  This will <span className="font-semibold text-slate-700">permanently delete
                  all your current results</span> — every bias you&apos;ve completed and its
                  analysis. This cannot be undone.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => { setPending(null); setError(null); }}
                disabled={switching}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSwitch}
                disabled={switching}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {switching ? "Switching…" : "Switch & delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { FOCUSES, type FocusSlug } from "../lib/focus";

interface Props {
  selected: FocusSlug | null;
  onSelect: (slug: FocusSlug) => void;
  disabled?: boolean;
}

/** Large, single-select focus cards. Renders whatever is in FOCUSES, so adding
 *  a context later needs no layout change. */
export default function FocusCards({ selected, onSelect, disabled }: Props) {
  return (
    <div role="radiogroup" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {FOCUSES.map((f) => {
        const soon = !!f.comingSoon;
        const isSel = !soon && f.slug === selected;
        return (
          <button
            key={f.slug}
            type="button"
            role="radio"
            aria-checked={isSel}
            aria-disabled={soon || undefined}
            disabled={disabled || soon}
            onClick={() => { if (!soon) onSelect(f.slug); }}
            className={[
              "text-left rounded-2xl border p-5 transition-all",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2",
              soon
                ? "border-slate-200 bg-slate-50 opacity-70 cursor-not-allowed"
                : isSel
                ? "border-teal-500 bg-teal-50"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={`font-semibold leading-snug ${soon ? "text-slate-500" : "text-slate-800"}`}>
                {f.label}
              </span>
              {soon ? (
                <span className="flex-none text-[10px] font-semibold uppercase tracking-wide text-slate-500 bg-slate-200 rounded-full px-2 py-0.5 mt-0.5">
                  Coming soon
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className={[
                    "flex-none w-5 h-5 rounded-full border flex items-center justify-center mt-0.5",
                    isSel ? "border-teal-500 bg-teal-500" : "border-slate-300",
                  ].join(" ")}
                >
                  {isSel && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              )}
            </div>
            <p className={`text-sm mt-1.5 leading-snug ${soon ? "text-slate-400" : "text-slate-500"}`}>
              {f.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

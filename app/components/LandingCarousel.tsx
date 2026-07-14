"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Sharpen your thinking with real-world scenarios.",
  "Every Boost reveals something about how you think.",
  "Find out what influenced your decision.",
  "See your blind spots before they become mistakes.",
];

const ROTATE_MS = 2000;

export default function LandingCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    // Respect reduced-motion: no automatic rotation.
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % MESSAGES.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      className="max-w-md"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Fixed-height stage so the page layout never shifts between messages */}
      <div className="relative h-16" aria-live="polite">
        {MESSAGES.map((m, i) => (
          <p
            key={i}
            aria-hidden={i !== index}
            className={[
              "absolute inset-0 flex items-start text-slate-500 text-lg leading-relaxed",
              "transition-opacity duration-700 ease-in-out motion-reduce:transition-none",
              i === index ? "opacity-100" : "opacity-0 pointer-events-none",
            ].join(" ")}
          >
            {m}
          </p>
        ))}
      </div>

      {/* Progress indicator — passive, non-interactive */}
      <div className="flex items-center gap-2.5 mt-4" aria-hidden="true">
        {MESSAGES.map((_, i) => (
          <span
            key={i}
            className={[
              "block h-2.5 rounded-full transition-all duration-300",
              i === index ? "w-7 bg-teal-500" : "w-2.5 bg-slate-300",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}

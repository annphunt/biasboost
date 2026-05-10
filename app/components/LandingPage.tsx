"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import IntroCarousel from "./IntroCarousel";
import { markIntroSeen } from "../actions";

interface Props {
  showCarousel: boolean;
}

export default function LandingPage({ showCarousel: initialShow }: Props) {
  const [showCarousel, setShowCarousel] = useState(initialShow);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"entrepreneur" | "trader">("entrepreneur");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function dismissCarousel() {
    await markIntroSeen();
    setShowCarousel(false);
  }

  async function handleContinue() {
    const id = Number(userId);
    if (!Number.isInteger(id) || id <= 0) {
      setError("Please enter a positive whole number.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to register user");
      }
      router.push(`/biases/${id}`);
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  }

  return (
    <>
      {showCarousel && (
        <IntroCarousel
          onDone={dismissCarousel}
          onSkip={dismissCarousel}
          hasSeenBefore={!initialShow}
        />
      )}

      <main className="min-h-screen flex flex-col bg-white">
        {/* Top bar */}
        <div className="border-b border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <Image src="/logo.png" alt="BiasBoost" width={82} height={28} className="h-7 w-auto" />
            </div>
            {!initialShow && !showCarousel && (
              <button
                onClick={() => setShowCarousel(true)}
                className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 transition-colors"
              >
                Tour
              </button>
            )}
          </div>
        </div>

        {/* Hero */}
        <div className="max-w-5xl mx-auto w-full px-4 py-16 space-y-12">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-800 leading-tight">
              Welcome to BiasBoost.
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed max-w-md">
              Simply choose a User ID to start. I&apos;ll be adding email to this soon.
            </p>
          </div>

          {/* Role selector */}
          <div className="max-w-sm space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-600">
              I am a…
            </p>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setRole("entrepreneur")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  role === "entrepreneur"
                    ? "bg-teal-600 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                Entrepreneur
              </button>
              <button
                onClick={() => setRole("trader")}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-l border-slate-200 ${
                  role === "trader"
                    ? "bg-teal-600 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                Trader
              </button>
            </div>
            <p className="text-xs text-slate-400">
              {role === "entrepreneur"
                ? "Questions are set in a business and leadership context."
                : "Questions are set in an FX, CFD, and stock trading context."}
            </p>
          </div>

          {/* User ID input */}
          <div className="max-w-sm space-y-3">
            <label
              htmlFor="userId"
              className="text-xs font-semibold uppercase tracking-widest text-teal-600"
            >
              Your User ID
            </label>
            <input
              id="userId"
              type="number"
              min={1}
              value={userId}
              onChange={(e) => { setUserId(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === "Enter" && handleContinue()}
              placeholder="Enter any positive number e.g. 1, 2, 3"
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-500 transition-colors placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-400">
              This is how your progress is saved. Use the same number each time.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleContinue}
              disabled={loading || !userId}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm tracking-wide transition-colors"
            >
              {loading ? "Loading…" : "Get started →"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

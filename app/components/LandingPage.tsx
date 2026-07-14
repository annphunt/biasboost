"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import LandingCarousel from "./LandingCarousel";

type Tab = "register" | "login";

export default function LandingPage() {
  const [tab, setTab] = useState<Tab>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    setError(null);
    if (!email.includes("@")) { setError("Please enter a valid email."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      if (tab === "register") {
        const reg = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!reg.ok) {
          const data = await reg.json().catch(() => ({}));
          throw new Error(data.detail ?? "Registration failed");
        }
      }
      const login = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!login.ok) {
        const data = await login.json().catch(() => ({}));
        throw new Error(data.detail ?? "Login failed");
      }
      // New accounts get the welcome intro; returning users go straight in.
      router.push(tab === "register" ? "/welcome" : "/biases");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center">
          <Image src="/logo.png" alt="BiasBoost" width={82} height={28} className="h-7 w-auto" />
        </div>
      </div>

      {/* Two-column hero */}
      <div className="max-w-6xl mx-auto w-full px-4 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* Left — messaging + form */}
        <div className="space-y-10">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-800 leading-[1.1]">
              Think more clearly.<br />Make better decisions.
            </h1>
            <LandingCarousel />
          </div>

          <div className="max-w-sm space-y-4">
            {/* Tabs */}
            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => { setTab("register"); setError(null); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === "register"
                    ? "bg-teal-600 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                Register
              </button>
              <button
                onClick={() => { setTab("login"); setError(null); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-l border-slate-200 ${
                  tab === "login"
                    ? "bg-teal-600 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                Sign in
              </button>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-teal-600">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="you@example.com"
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-500 transition-colors placeholder:text-slate-400"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-teal-600">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={tab === "register" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={tab === "register" ? "At least 8 characters" : "Your password"}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-500 transition-colors placeholder:text-slate-400"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !email || !password}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm tracking-wide transition-colors"
            >
              {loading
                ? (tab === "register" ? "Creating account…" : "Signing in…")
                : (tab === "register" ? "Start Learning →" : "Sign in →")}
            </button>

            {tab === "register" && (
              <p className="text-xs text-slate-400 leading-relaxed">
                Create a free account to save your progress, track your improvement and
                personalise your learning.
              </p>
            )}
          </div>
        </div>

        {/* Right — product preview placeholder */}
        <div className="hidden lg:block">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 h-full min-h-[420px] flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 bg-white border border-slate-200 rounded-full px-2.5 py-1">
                Product Preview
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-400 max-w-xs leading-relaxed">
              Interactive scenarios and examples will live here — a look at how
              BiasBoost works before you dive in.
            </p>

            {/* Subtle placeholder blocks */}
            <div className="mt-8 space-y-4 flex-1">
              <div className="h-24 rounded-xl bg-white border border-slate-200/80" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 rounded-xl bg-white border border-slate-200/80" />
                <div className="h-16 rounded-xl bg-white border border-slate-200/80" />
              </div>
              <div className="h-4 w-2/3 rounded-full bg-slate-200/70" />
              <div className="h-4 w-1/2 rounded-full bg-slate-200/70" />
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import IntroCarousel from "./IntroCarousel";
import { markIntroSeen } from "../actions";

interface Props {
  showCarousel: boolean;
}

type Tab = "register" | "login";

export default function LandingPage({ showCarousel: initialShow }: Props) {
  const [showCarousel, setShowCarousel] = useState(initialShow);
  const [tab, setTab] = useState<Tab>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function dismissCarousel() {
    await markIntroSeen();
    setShowCarousel(false);
  }

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
      router.push("/biases");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
        <div className="max-w-5xl mx-auto w-full px-4 py-16 space-y-10">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-800 leading-tight">
              Welcome to BiasBoost.
            </h1>
            <p className="text-slate-500 text-lg leading-relaxed max-w-md">
              Create an account to save your progress across sessions.
            </p>
          </div>

          <div className="max-w-sm space-y-6">
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
              {loading ? (tab === "register" ? "Creating account…" : "Signing in…") : (tab === "register" ? "Create account →" : "Sign in →")}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

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
  // Set to the email address once an account is awaiting email verification.
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [resend, setResend] = useState<"idle" | "sending" | "sent">("idle");
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
        const regData = await reg.json().catch(() => ({}));
        if (!reg.ok) throw new Error(regData.detail ?? "Registration failed");
        if (regData.status === "pending_verification") {
          setVerifyEmail(email);
          setResend("idle");
          setLoading(false);
          return;
        }
        // verification disabled → fall through and sign in automatically
      }
      const login = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!login.ok) {
        const data = await login.json().catch(() => ({}));
        if (login.status === 403 && /verif/i.test(String(data.detail ?? ""))) {
          setVerifyEmail(email);
          setResend("idle");
          setLoading(false);
          return;
        }
        throw new Error(data.detail ?? "Login failed");
      }
      // New accounts get the welcome intro; returning users go straight in.
      router.push(tab === "register" ? "/welcome" : "/biases");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  async function resendVerification() {
    if (!verifyEmail) return;
    setResend("sending");
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail }),
      });
    } catch {
      /* the endpoint acknowledges regardless; nothing to surface */
    }
    setResend("sent");
  }

  function backToForm() {
    setVerifyEmail(null);
    setResend("idle");
    setError(null);
    setPassword("");
  }

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center">
          <Image
            src="/logo-mark.png"
            alt="BiasBoost"
            width={44}
            height={44}
            priority
            className="h-11 w-auto"
          />
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
            {verifyEmail ? (
              <div className="space-y-4 rounded-2xl border border-teal-200 bg-teal-50 p-6">
                <div className="text-3xl leading-none">✉️</div>
                <div className="space-y-1.5">
                  <h2 className="text-lg font-semibold text-slate-800">Check your email</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    We&apos;ve sent a verification link to{" "}
                    <span className="font-medium text-slate-800">{verifyEmail}</span>. Click it
                    to activate your account, then sign in.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <button
                    onClick={resendVerification}
                    disabled={resend !== "idle"}
                    className="font-medium text-teal-700 hover:text-teal-800 disabled:opacity-60 disabled:cursor-default"
                  >
                    {resend === "sending" ? "Sending…" : resend === "sent" ? "Email sent ✓" : "Resend email"}
                  </button>
                  <button onClick={backToForm} className="text-slate-500 hover:text-slate-700">
                    Use a different email
                  </button>
                </div>
              </div>
            ) : (
              <>
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
              </>
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

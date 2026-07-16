"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

type State = "verifying" | "success" | "error";

function VerifyInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<State>("verifying");
  const token = params.get("token");

  useEffect(() => {
    if (!token) { setState("error"); return; }
    let cancelled = false;
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => { if (!cancelled) setState(r.ok ? "success" : "error"); })
      .catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="max-w-md w-full text-center space-y-5">
      {state === "verifying" && (
        <>
          <svg className="animate-spin w-8 h-8 text-teal-500 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-slate-500">Verifying your email…</p>
        </>
      )}

      {state === "success" && (
        <>
          <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Email verified</h1>
            <p className="text-slate-500">Your account is active. You can sign in now.</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm tracking-wide transition-colors"
          >
            Sign in →
          </button>
        </>
      )}

      {state === "error" && (
        <>
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Link invalid or expired</h1>
            <p className="text-slate-500 max-w-sm mx-auto">
              This verification link is no longer valid. Head back and sign in to have a fresh
              one sent to you.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm tracking-wide transition-colors"
          >
            Back to sign in
          </button>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center">
          <Image src="/logo-mark.png" alt="BiasBoost" width={44} height={44} priority className="h-11 w-auto" />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <Suspense fallback={<p className="text-slate-400">Loading…</p>}>
          <VerifyInner />
        </Suspense>
      </div>
    </main>
  );
}

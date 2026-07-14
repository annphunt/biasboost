"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function WelcomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center">
          <Image src="/logo.png" alt="BiasBoost" width={82} height={28} className="h-7 w-auto" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full space-y-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-800 leading-tight">
            Welcome to BiasBoost
          </h1>

          <div className="space-y-5 text-slate-500 text-lg leading-relaxed">
            <p>Every important decision begins with the same question:</p>
            <p className="text-xl sm:text-2xl font-medium text-slate-800">
              Can I trust my own judgement?
            </p>
            <p>
              This assessment explores how you naturally evaluate evidence, handle
              uncertainty and make decisions.
            </p>
            <p>
              Through realistic scenarios, you&apos;ll identify the hidden thinking
              patterns that influence your judgement every day.
            </p>
            <p>
              When you finish, you&apos;ll receive a personalised{" "}
              <span className="font-medium text-slate-700">Bias Profile</span> and
              practical ways to improve your decision-making.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => router.push("/onboarding")}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm tracking-wide transition-colors"
            >
              Get started →
            </button>
            <p className="text-xs text-slate-400">
              Takes about 30 minutes. Better on a laptop. Pause and return whenever you like.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

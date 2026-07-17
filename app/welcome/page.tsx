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
          <Image src="/logo-mark.png" alt="BiasBoost" width={32} height={32} className="h-8 w-auto" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full space-y-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-800 leading-tight">
            Welcome to BiasBoost
          </h1>

          <div className="space-y-5 text-slate-500 text-lg leading-relaxed">
            <p className="text-xl sm:text-2xl font-medium text-slate-800">
              You&apos;re about to discover how you make decisions—not how you
              think you make decisions.
            </p>
            <p>
              Over the next 30 minutes, you&apos;ll work through a series of
              realistic scenarios based on your chosen role. Each completed Boost
              reveals one of the hidden thinking patterns that can influence your
              judgement.
            </p>
            <p>
              As you complete each Boost, you&apos;ll build your{" "}
              <span className="font-medium text-slate-700">Personalized Bias Profile</span>,
              helping you recognise where your thinking is strongest and where
              hidden blind spots may exist.
            </p>
            <p>You can pause at any time and continue whenever you&apos;re ready.</p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => router.push("/onboarding")}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm tracking-wide transition-colors"
            >
              Begin My First Boost →
            </button>
            <p className="text-xs text-slate-400">
              Takes about 30 minutes. You can pause and continue anytime.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

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
            Welcome to BiasBoost.
          </h1>

          <div className="space-y-5 text-slate-500 text-lg leading-relaxed">
            <p>
              Better judgement isn&apos;t something you learn once. It&apos;s something
              you practise.
            </p>
            <p>
              Over the next few minutes you&apos;ll work through a series of realistic
              scenarios designed to reveal the hidden thinking patterns that affect all
              of us.
            </p>
            <p className="text-slate-600">
              There are no perfect scores. The goal isn&apos;t to eliminate bias —
              it&apos;s to become better at recognising it.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => router.push("/biases")}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm tracking-wide transition-colors"
            >
              Start First Exercise →
            </button>
            <p className="text-xs text-slate-400">Takes about 5 minutes.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const INTRO_KEY = "biasboost_intro_seen";

const INTRO_SLIDES = [
  {
    body: [
      `This assessment is designed to help you understand how you think — not how “smart” or “rational” you are.`,
      "Every person, regardless of experience or intelligence, relies on mental shortcuts and patterns when making decisions. These are known as cognitive biases. In many situations they are useful and efficient. In others, they can quietly distort judgment, increase risk, or narrow perspective.",
    ],
  },
  {
    body: [
      "The goal of the assessment is to help you to become aware of your own decision-making tendencies so you can:",
    ],
    bullets: [
      "make better strategic decisions,",
      "communicate more effectively,",
      "recognise blind spots earlier,",
      "and build stronger thinking habits over time.",
    ],
  },
  {
    heading: "To get the most value from the assessment:",
    body: [],
    bullets: [
      "Answer quickly and instinctively.",
      'Avoid trying to choose the "best" or most rational answer.',
      "Don't overanalyse what the question is testing.",
      "Treat the process as reflection and learning — not performance.",
    ],
    footer: "There are no perfect results. In fact, the most useful outcomes often come from discovering patterns you didn't expect.",
  },
  {
    body: [
      "You'll be given a detailed understanding of your biases, as well as an understanding of how it affects your decision making.",
    ],
  },
];

interface Props {
  onDone: () => void;
  onSkip: () => void;
  hasSeenBefore: boolean;
}

export default function IntroCarousel({ onDone, onSkip, hasSeenBefore }: Props) {
  const [slide, setSlide] = useState(0);
  const current = INTRO_SLIDES[slide];
  const isLast = slide === INTRO_SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Top bar */}
      <div className="border-b border-slate-200">
        <div className="max-w-xl mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Image src="/logo.png" alt="BiasBoost" width={82} height={28} className="h-7 w-auto" />
          </div>
          {hasSeenBefore && (
            <button
              onClick={onSkip}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Skip →
            </button>
          )}
        </div>
      </div>

      {/* Persistent heading */}
      <div className="max-w-xl mx-auto w-full px-8 pt-10 pb-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800 leading-tight">
          Welcome to BiasBoost.
        </h1>
        {slide === 0 && (
          <p className="mt-2 text-teal-600 font-medium text-base">
            Test your cognitive biases.
          </p>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-6 pb-2">
        {INTRO_SLIDES.map((_, i) => (
          <span
            key={i}
            className={`inline-block w-1.5 h-1.5 rounded-full transition-colors ${
              i === slide ? "bg-teal-500" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full px-8 space-y-5">
        {"heading" in current && current.heading && (
          <p className="text-slate-800 font-semibold text-lg leading-snug">
            {current.heading}
          </p>
        )}
        {current.body.map((para, i) => (
          <p key={i} className="text-slate-600 text-base leading-relaxed">
            {para}
          </p>
        ))}
        {"bullets" in current && current.bullets && (
          <ul className="space-y-2 pl-1">
            {current.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-slate-600 text-base">
                <span className="mt-2 w-1 h-1 rounded-full bg-teal-500 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        )}
        {"footer" in current && current.footer && (
          <p className="text-slate-400 text-sm leading-relaxed italic pt-1">
            {current.footer}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center max-w-xl mx-auto w-full px-8 pb-12 pt-6">
        <button
          onClick={() => setSlide((s) => Math.max(0, s - 1))}
          className={`text-sm text-slate-400 hover:text-slate-600 transition-colors ${
            slide === 0 ? "invisible" : ""
          }`}
        >
          ← Back
        </button>

        {isLast ? (
          <button
            onClick={onDone}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
          >
            Get started →
          </button>
        ) : (
          <button
            onClick={() => setSlide((s) => s + 1)}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

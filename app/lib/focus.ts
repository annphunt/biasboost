// Focus categories shown to the user. The `slug` is the value stored in the
// user's profile (users.role) — the single source of truth. Add a new context
// here (and seed its questions) without touching the onboarding/settings layout.

export type FocusSlug = "entrepreneur" | "trader" | "executive";

export interface Focus {
  slug: FocusSlug;
  label: string;
  description: string;
}

export const FOCUSES: Focus[] = [
  {
    slug: "entrepreneur",
    label: "Startup Founder",
    description: "Founder decisions — product, customers, hiring and runway.",
  },
  {
    slug: "executive",
    label: "Company Director",
    description: "Senior decisions — strategy, people and judgement calls.",
  },
  {
    slug: "trader",
    label: "Financial Trader",
    description: "Market decisions — positions, risk and reacting to P&L.",
  },
];

export function focusLabel(slug: string | null | undefined): string {
  return FOCUSES.find((f) => f.slug === slug)?.label ?? "—";
}

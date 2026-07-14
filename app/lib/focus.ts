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
    label: "Building a Business",
    description: "Founder decisions — product, customers, hiring and runway.",
  },
  {
    slug: "trader",
    label: "Investing & Trading",
    description: "Market decisions — positions, risk and reacting to P&L.",
  },
  {
    slug: "executive",
    label: "Work & Leadership",
    description: "Senior decisions — strategy, people and judgement calls.",
  },
];

export function focusLabel(slug: string | null | undefined): string {
  return FOCUSES.find((f) => f.slug === slug)?.label ?? "—";
}

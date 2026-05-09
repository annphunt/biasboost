"use server";

import { cookies } from "next/headers";

export async function markIntroSeen() {
  const store = await cookies();
  store.set("bb_intro_seen", "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false,
    sameSite: "lax",
  });
}

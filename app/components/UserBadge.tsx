"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UserBadge() {
  const [email, setEmail] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setEmail(d.email));
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <div className="flex items-center gap-3">
      {email && (
        <span className="text-xs text-slate-400 hidden sm:inline truncate max-w-[180px]">
          {email}
        </span>
      )}
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
      >
        {loggingOut ? "…" : "Sign out"}
      </button>
    </div>
  );
}

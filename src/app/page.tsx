"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/SessionStore";

export default function HomePage() {
  const router = useRouter();
  const getLastActive = useSessionStore((s) => s.getLastActive);

  useEffect(() => {
    const last = getLastActive();
    if (last) {
      router.push(`/graph/${last}`);
    }
  }, [router, getLastActive]);

  return (
    <main className="flex flex-col items-center justify-center h-screen text-[var(--foreground)]">
      <h1 className="text-2xl font-semibold text-[var(--accent)]">FILON</h1>
      <p className="opacity-80 mt-2">Loading your last workspace…</p>
    </main>
  );
}

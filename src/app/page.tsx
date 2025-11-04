"use client";

import { useEffect } from "react";
import AppShell from "@/components/shell/AppShell";
import ComposerPanel from "@/components/ComposerPanel";
import ContextStream from "@/components/ContextStream";
import { useSessionStore } from "@/store/SessionStore";

export default function Home() {
  const setActiveSession = useSessionStore((state) => state.setActiveSession);

  useEffect(() => {
    setActiveSession(null);
    if (typeof document !== "undefined") {
      document.title = "FILON — Willkommen";
    }
  }, [setActiveSession]);

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        <h1 className="text-2xl font-semibold text-zinc-300">
          Willkommen bei FILON
        </h1>
        <ContextStream />
        <ComposerPanel />
      </div>
    </AppShell>
  );
}

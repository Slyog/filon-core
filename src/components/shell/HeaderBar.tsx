"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { PanelLeft, Share2, Settings } from "lucide-react";
import { useUIShellStore } from "@/store/UIShellStore";
import { useSessionStore } from "@/store/SessionStore";

export default function HeaderBar() {
  const toggle = useUIShellStore((state) => state.toggleSidebar);
  const pathname = usePathname();
  const sessions = useSessionStore((state) => state.sessions);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);

  const title = useMemo(() => {
    if (pathname?.startsWith("/f/") && activeSessionId) {
      const match = sessions.find((session) => session.id === activeSessionId);
      return match?.title ?? "Workspace";
    }
    return "Willkommen";
  }, [pathname, activeSessionId, sessions]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = `FILON — ${title}`;
    }
  }, [title]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-12 items-center border-b border-zinc-900 bg-black/75 backdrop-blur">
      <div className="flex flex-1 items-center gap-2 px-3">
        <button
          type="button"
          onClick={toggle}
          className="rounded-lg p-2 text-zinc-300 transition hover:bg-zinc-900"
          aria-label="Sidebar umschalten"
        >
          <PanelLeft size={18} />
        </button>
        <div className="font-semibold tracking-wide text-zinc-200">
          FILON —{" "}
          <span className="text-zinc-400" title={title}>
            {title}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3">
        <button
          type="button"
          onClick={() =>
            window.alert("Link teilen (Platzhalter) – Funktion folgt.")
          }
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-1 text-sm text-zinc-300 transition hover:bg-zinc-800"
          title="Link teilen (Platzhalter)"
        >
          <Share2 size={16} />
          <span className="hidden sm:inline">Share</span>
        </button>
        <button
          type="button"
          onClick={() =>
            window.alert("Einstellungen (Platzhalter) – demnächst verfügbar.")
          }
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-1 text-sm text-zinc-300 transition hover:bg-zinc-800"
          title="Einstellungen (Platzhalter)"
        >
          <Settings size={16} />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>
    </header>
  );
}

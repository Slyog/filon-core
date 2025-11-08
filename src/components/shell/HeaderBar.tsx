"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { PanelLeft, Share2, Settings } from "lucide-react";
import { useUIShellStore } from "@/store/UIShellStore";
import { useSessionStore } from "@/store/SessionStore";
import ExportDialog from "@/components/ExportDialog";

export default function HeaderBar() {
  const toggle = useUIShellStore((state) => state.toggleSidebar);
  const pathname = usePathname();
  const sessions = useSessionStore((state) => state.sessions);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const [exportOpen, setExportOpen] = useState(false);

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
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-brand-dark/30 bg-surface-hover/90 px-4 py-2 tracking-wide backdrop-blur-sm">
      <div className="flex flex-1 items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          className="rounded-lg p-2 text-zinc-300 transition hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          aria-label="Sidebar umschalten"
        >
          <PanelLeft size={18} />
        </button>
        <h1 className="text-brand text-sm font-normal uppercase tracking-[0.3em]">
          FILON
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExportOpen(true)}
          className="rounded-xl bg-brand/20 px-3 py-1.5 text-sm font-normal uppercase tracking-[0.2em] text-brand transition hover:bg-brand/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          aria-label="Exportieren"
        >
          Exportieren
        </button>
        <button
          type="button"
          onClick={() =>
            window.alert("Link teilen (Platzhalter) – Funktion folgt.")
          }
          className="flex items-center gap-2 rounded-lg bg-cyan-700/40 px-3 py-1.5 text-sm font-light uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
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
          className="flex items-center gap-2 rounded-lg bg-cyan-700/40 px-3 py-1.5 text-sm font-light uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          title="Einstellungen (Platzhalter)"
        >
          <Settings size={16} />
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>
      <ExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        sessionId={activeSessionId || undefined}
      />
    </header>
  );
}

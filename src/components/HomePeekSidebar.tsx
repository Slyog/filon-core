"use client";

import clsx from "clsx";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  Brain,
  ChevronRight,
  Folder,
  LogIn,
  Settings,
  Waves,
} from "lucide-react";
import { useSessionStore } from "@/store/SessionStore";
import { usePanelFocus } from "@/store/PanelFocusStore";
import {
  useHydrateUIShell,
  useUIShellStore,
} from "@/store/UIShellStore";

type WorkspaceNavEntry = {
  id: string;
  title: string;
  updatedAt?: number;
  createdAt?: number;
};

const WORKSPACE_TITLE_PREFIX = "workspaceTitle:";

const readWorkspaceTitles = (): WorkspaceNavEntry[] => {
  if (typeof window === "undefined" || !window.localStorage) return [];

  const entries: WorkspaceNavEntry[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !key.startsWith(WORKSPACE_TITLE_PREFIX)) continue;

    const id = key.slice(WORKSPACE_TITLE_PREFIX.length);
    const title =
      window.localStorage.getItem(key)?.trim() || "Untitled Workspace";

    entries.push({ id, title });
  }

  return entries;
};

export default function HomePeekSidebar() {
  useHydrateUIShell();

  const router = useRouter();
  const sessions = useSessionStore((state) => state.sessions);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const setActiveSession = useSessionStore((state) => state.setActiveSession);
  const setActivePanel = usePanelFocus((state) => state.setActivePanel);
  const open = useUIShellStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIShellStore((state) => state.toggleSidebar);

  const [workspaces, setWorkspaces] = useState<WorkspaceNavEntry[]>([]);
  const [showPulse, setShowPulse] = useState(false);

  const sessionMeta = useMemo(() => {
    return sessions.reduce<Record<string, WorkspaceNavEntry>>(
      (acc, session) => {
        acc[session.id] = {
          id: session.id,
          title: session.title || "Untitled Workspace",
          updatedAt: session.updatedAt,
          createdAt: session.createdAt,
        };
        return acc;
      },
      {}
    );
  }, [sessions]);

  const refreshWorkspaces = useCallback(() => {
    const stored = readWorkspaceTitles();
    const merged = new Map<string, WorkspaceNavEntry>();

    stored.forEach((entry) => {
      const meta = sessionMeta[entry.id];
      merged.set(entry.id, meta ? { ...meta, title: meta.title } : entry);
    });

    Object.values(sessionMeta).forEach((entry) => {
      const existing = merged.get(entry.id);
      merged.set(entry.id, {
        id: entry.id,
        title: entry.title || existing?.title || "Untitled Workspace",
        updatedAt: entry.updatedAt ?? existing?.updatedAt,
        createdAt: entry.createdAt ?? existing?.createdAt,
      });
    });

    const list = Array.from(merged.values()).sort((a, b) => {
      const left = a.updatedAt ?? a.createdAt ?? 0;
      const right = b.updatedAt ?? b.createdAt ?? 0;
      return right - left;
    });

    setWorkspaces(list);
  }, [sessionMeta]);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (
        event.key.startsWith(WORKSPACE_TITLE_PREFIX) ||
        event.key === "lastWorkspaceId"
      ) {
        refreshWorkspaces();
      }
    };

    const handleFocus = () => refreshWorkspaces();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshWorkspaces();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshWorkspaces]);

  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;

    setShowPulse(true);
    const timer = window.setTimeout(() => setShowPulse(false), 520);
    return () => window.clearTimeout(timer);
  }, [open]);

  const handleWorkspaceNavigate = useCallback(
    (workspaceId: string) => {
      setActiveSession(workspaceId);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("lastWorkspaceId", workspaceId);
        } catch (_error) {
          // Ignore storage limitations
        }
      }
      router.push(`/f/${workspaceId}`);
    },
    [router, setActiveSession]
  );

  const handlePanelFocus = useCallback(
    (panel: "AI_SUMMARIZER" | "CONTEXT_STREAM", title: string) => {
      setActivePanel(panel);
      if (typeof window === "undefined") return;

      window.requestAnimationFrame(() => {
        const element = document.querySelector<HTMLElement>(
          `[aria-label="${title}"]`
        );

        if (!element) return;

        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.animate(
          [
            { boxShadow: "0 0 0 rgba(47,243,255,0)" },
            { boxShadow: "0 0 24px rgba(47,243,255,0.4)" },
            { boxShadow: "0 0 0 rgba(47,243,255,0)" },
          ],
          { duration: 520, easing: "ease-out" }
        );
      });
    },
    [setActivePanel]
  );

  const sections = useMemo(
    () => [
      {
        key: "workspaces",
        title: "Workspaces",
        emptyLabel: "No workspaces yet",
        items: workspaces.map((workspace) => ({
          id: workspace.id,
          icon: Folder,
          label: workspace.title,
          active: workspace.id === activeSessionId,
          onClick: () => handleWorkspaceNavigate(workspace.id),
        })),
      },
      {
        key: "panels",
        title: "Panels",
        items: [
          {
            id: "panels-ai-summarizer",
            icon: Brain,
            label: "AI Summarizer",
            onClick: () => handlePanelFocus("AI_SUMMARIZER", "AI Summarizer"),
          },
          {
            id: "panels-context-stream",
            icon: Waves,
            label: "Context Stream",
            onClick: () =>
              handlePanelFocus("CONTEXT_STREAM", "Context Stream"),
          },
        ],
      },
      {
        key: "account",
        title: "Account",
        items: [
          { id: "account-settings", icon: Settings, label: "Settings", onClick: () => router.push("/settings") },
          { id: "account-login", icon: LogIn, label: "Login", onClick: () => router.push("/login") },
          { id: "account-archive", icon: Archive, label: "Archive", onClick: () => router.push("/archive") },
        ],
      },
    ],
    [
      activeSessionId,
      handlePanelFocus,
      handleWorkspaceNavigate,
      router,
      workspaces,
    ]
  );

  return (
    <motion.div
      layout
      initial={false}
      className="relative flex flex-col h-full w-full overflow-y-auto px-3 py-4"
    >
        <AnimatePresence>
          {showPulse && (
            <motion.div
              key="pulse"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 0.3, scale: 1.05 }}
              exit={{ opacity: 0, scale: 1.08 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="pointer-events-none absolute inset-3 rounded-3xl border border-cyan-400/40"
            />
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={toggleSidebar}
          whileTap={{ scale: 0.92 }}
          className="group relative mx-3 mt-4 mb-5 flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/5 text-cyan-300/80 transition-colors hover:border-cyan-400/40 hover:bg-cyan-400/15 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          <ChevronRight
            className={clsx(
              "h-5 w-5 transition-transform duration-200 ease-out",
              open ? "rotate-90" : "rotate-0"
            )}
          />
          <span className="pointer-events-none absolute -bottom-6 left-1/2 hidden -translate-x-1/2 text-[10px] uppercase tracking-[0.28em] text-cyan-300/70 group-hover:block">
            {open ? "Close" : "Open"}
          </span>
        </motion.button>

        <nav className="flex flex-1 flex-col gap-6 px-2 pb-6">
          {sections.map((section) => (
            <div key={section.key} className="space-y-2">
              <AnimatePresence>
                {open && (
                  <motion.p
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 0.7, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="ml-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300/70"
                  >
                    {section.title}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-1">
                {section.items.length === 0 && section.emptyLabel && open && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    className="ml-3 rounded-xl border border-dashed border-cyan-400/20 px-3 py-2 text-xs text-cyan-400/60"
                  >
                    {section.emptyLabel}
                  </motion.p>
                )}

                {section.items.map(({ id, icon: Icon, label, onClick, active }) => (
                  <motion.button
                    key={id}
                    type="button"
                    onClick={onClick}
                    whileHover={{ scale: open ? 1.01 : 1 }}
                    whileTap={{ scale: open ? 0.97 : 0.94 }}
                    className={clsx(
                      "focus-glow flex items-center gap-3 rounded-2xl px-3 py-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                      open ? "justify-start" : "justify-center",
                      active
                        ? "bg-cyan-500/15 text-cyan-100 shadow-[0_0_12px_#2FF3FF33]"
                        : "text-cyan-300/80 hover:bg-cyan-400/12 hover:text-cyan-100"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {open && (
                      <span className="truncate text-sm font-medium">
                        {label}
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </nav>
    </motion.div>
  );
}

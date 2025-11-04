"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive,
  Folder,
  LogIn,
  Plus,
  Settings,
  Upload,
  Database,
  Circle,
} from "lucide-react";
import Section from "./Section";
import WorkspaceListLite from "@/components/WorkspaceListLite";
import { useUIShellStore } from "@/store/UIShellStore";
import { usePanelRegistry } from "@/store/PanelRegistry";

export default function SidebarNav() {
  const router = useRouter();
  const sidebarOpen = useUIShellStore((state) => state.sidebarOpen);
  const [quickOpen, setQuickOpen] = useState(true);
  const { panels } = usePanelRegistry();

  return (
    <AnimatePresence mode="wait">
      {!sidebarOpen ? (
        <motion.aside
          key="closed"
          initial={{ width: 64 }}
          animate={{ width: 64 }}
          exit={{ width: 64 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="sticky top-12 h-[calc(100vh-48px)] w-16 shrink-0 border-r border-zinc-900 bg-black/90"
        >
          <div className="flex h-full flex-col items-center gap-3 py-4">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-cyan-300 hover:bg-zinc-800"
              title="Zur Landing"
            >
              <Folder size={18} />
            </button>
            <WorkspaceListLite collapsed />
          </div>
        </motion.aside>
      ) : (
        <motion.aside
          key="open"
          initial={{ width: 64 }}
          animate={{ width: 256 }}
          exit={{ width: 64 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="sticky top-12 h-[calc(100vh-48px)] w-64 shrink-0 overflow-y-auto border-r border-zinc-900 bg-black/90"
        >
          <div className="flex h-full flex-col gap-6 px-3 py-4">
            <Section title="Workspaces" icon={<Folder size={14} />}>
              <WorkspaceListLite />
            </Section>

            <div>
              <button
                type="button"
                onClick={() => setQuickOpen((prev) => !prev)}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:bg-zinc-900"
              >
                <Plus size={14} />
                Quick Actions
                <span
                  className={`ml-auto text-xs ${quickOpen ? "" : "rotate-180"}`}
                >
                  ▼
                </span>
              </button>
              {quickOpen && (
                <div className="mt-2 space-y-2">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
                    onClick={() =>
                      window.alert(
                        "Import (Platzhalter) – folgt in zukünftiger Version."
                      )
                    }
                  >
                    <Upload size={16} /> Import
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
                    onClick={() =>
                      window.alert(
                        "Snapshots (Platzhalter) – später hinzufügen."
                      )
                    }
                  >
                    <Database size={16} /> Snapshots
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
                    onClick={() =>
                      window.alert(
                        "Settings (Platzhalter) – demnächst verfügbar."
                      )
                    }
                  >
                    <Settings size={16} /> Settings
                  </button>
                </div>
              )}
            </div>

            <Section title="Active Panels" icon={<Circle size={14} />}>
              <div className="space-y-2">
                {panels.map((panel) => (
                  <motion.div
                    key={panel.key}
                    layout
                    className="flex items-center gap-2 px-2 py-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    role="status"
                    aria-label={`${panel.title} ${
                      panel.active ? "active" : "inactive"
                    }`}
                  >
                    <Circle
                      size={10}
                      className={
                        panel.active ? "text-emerald-400" : "text-gray-600"
                      }
                      fill={panel.active ? "currentColor" : "none"}
                    />
                    <span
                      className={
                        panel.active ? "text-gray-100" : "text-gray-500"
                      }
                    >
                      {panel.title}
                    </span>
                  </motion.div>
                ))}
              </div>
            </Section>

            <Section title="Archiv" icon={<Archive size={14} />}>
              <button
                type="button"
                onClick={() =>
                  window.alert("Archiv (Platzhalter) – später verfügbar.")
                }
                className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
              >
                Gehe zum Archiv
              </button>
            </Section>

            <div className="mt-auto border-t border-zinc-900 pt-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Account
              </div>
              <button
                type="button"
                onClick={() =>
                  window.alert("Login / Single Sign-On (Platzhalter).")
                }
                className="mt-2 flex w-full items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
              >
                <LogIn size={16} /> Login
              </button>
              <p className="mt-2 text-xs text-zinc-500">
                Helmut Sey (Platzhalter)
              </p>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

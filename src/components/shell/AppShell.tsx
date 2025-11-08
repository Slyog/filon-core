"use client";

import { PropsWithChildren, useEffect, useMemo } from "react";
import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import HeaderBar from "./HeaderBar";
import SidebarNav from "./Sidebar";
import SidebarPeek from "./SidebarPeek";
import AhaTour from "@/components/tour/AhaTour";
import { useHydrateUIShell } from "@/store/UIShellStore";
import ContextStream, {
  type ContextStreamItem,
} from "@/components/ContextStream";
import { usePanelHotkeys } from "@/hooks/usePanelHotkeys";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useExplainCache } from "@/store/ExplainCache";
import { useFramePerf } from "@/hooks/useFramePerf";
import { useContextStreamStore } from "@/store/ContextStreamStore";
import { InteractiveLight } from "@/components/ui/InteractiveLight";
import { MindVisualizer } from "@/components/ui/MindVisualizer";
import { AudioResonance } from "@/components/ui/AudioResonance";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { SettingsDrawer } from "@/components/ui/SettingsDrawer";

const WORKSPACE_PATH = /^\/f\//;

export default function AppShell({ children }: PropsWithChildren) {
  useHydrateUIShell();
  usePanelHotkeys();
  useHotkeys();

  const pathname = usePathname();
  const isHome = pathname === "/";
  const isWorkspace = WORKSPACE_PATH.test(pathname ?? "");

  const { loadCache } = useExplainCache();
  const { fps, avg } = useFramePerf();
  const { summaries } = useContextStreamStore();

  const streamItems = useMemo<ContextStreamItem[]>(
    () =>
      summaries.map((summary) => ({
        id: summary.id,
        title: summary.text.slice(0, 48),
        summary: summary.text,
        confidence: Math.round(summary.confidence * 100),
        ts: summary.createdAt,
      })),
    [summaries]
  );

  useEffect(() => {
    if (isHome) return;
    loadCache();
  }, [loadCache, isHome]);

  useEffect(() => {
    if (typeof window === "undefined") return;
      (window as any).__filonPerf = {
        fps,
        avg,
        logKeystrokeDelay: (delay: number) => {
          console.log(`[PERF] Keystroke to action delay: ${delay.toFixed(2)}ms`);
        },
      };
  }, [fps, avg]);

  const reduced = useReducedMotion();

  const chrome = (
    <>
      <AhaTour />
      <SidebarPeek />
      <InteractiveLight />
      <MindVisualizer />
      <AudioResonance />
      <LoadingOverlay />
      <SettingsDrawer />
    </>
  );

  if (isHome) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-[#050b10] text-cyan-100">
          {children}
        </div>
        {chrome}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="relative flex min-h-screen flex-col bg-surface-base text-text-primary">
        <HeaderBar />
        <div className="flex flex-1 overflow-hidden">
          {isWorkspace && <SidebarNav />}
          <div className="flex-1 overflow-hidden">
            <div className="flex h-full flex-col">
              <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
              {isWorkspace && (
                <div className="border-t border-cyan-500/15 bg-surface-hover/60 px-6 py-6 backdrop-blur-sm">
              <ContextStream
                items={streamItems}
                    onSelect={(id) =>
                      console.log(`[ContextStream] selected ${id}`)
                    }
                    position="bottom"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      {!reduced && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
            transition={{ duration: 0.12, ease: [0.25, 0.8, 0.4, 1] }}
            className="pointer-events-none fixed bottom-4 right-4 z-50 rounded-md border border-neutral-800 bg-neutral-900/90 px-3 py-2 text-xs font-mono text-neutral-300"
        >
          FPS: {fps} (avg: {avg.toFixed(1)}ms)
        </motion.div>
      )}
      </div>
      {chrome}
    </ThemeProvider>
  );
}

"use client";

import { PropsWithChildren, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import HeaderBar from "./HeaderBar";
import SidebarNav from "./Sidebar";
import { useHydrateUIShell } from "@/store/UIShellStore";
import DynamicPanel from "@/components/DynamicPanel";
import ContextStream from "@/components/ContextStream";
import { usePanelHotkeys } from "@/hooks/usePanelHotkeys";
import { useExplainCache } from "@/store/ExplainCache";
import { useFramePerf } from "@/hooks/useFramePerf";

export default function AppShell({ children }: PropsWithChildren) {
  useHydrateUIShell();
  usePanelHotkeys();
  const { loadCache } = useExplainCache();
  const { fps, avg } = useFramePerf();
  const reduced = useReducedMotion();

  useEffect(() => {
    loadCache();
  }, [loadCache]);

  // Expose performance metrics to window for QA
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__filonPerf = {
        fps,
        avg,
        logKeystrokeDelay: (delay: number) => {
          console.log(`[PERF] Keystroke to action delay: ${delay.toFixed(2)}ms`);
        },
      };
    }
  }, [fps, avg]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen grid grid-rows-[auto,1fr,auto] bg-[#0A0F12] text-gray-100"
    >
      {/* Header */}
      <div className="row-start-1">
        <HeaderBar />
      </div>

      {/* Main Content Area with Sidebar */}
      <main className="row-start-2 flex overflow-hidden">
        {/* Sidebar - bereits animiert in SidebarNav Komponente */}
        <SidebarNav />

        {/* Centered Content Container */}
        <div className="flex-1 overflow-y-auto">
          <motion.div
            layout
            className="relative flex flex-col items-center justify-center min-h-[75vh] mx-auto w-full max-w-7xl p-6 space-y-6"
          >
            {/* Core Panels */}
            <DynamicPanel flag="CONTEXT_STREAM" title="Context Stream">
              <ContextStream />
            </DynamicPanel>

            <DynamicPanel flag="SESSION_FEEDBACK" title="Session Feedback">
              <p className="text-gray-400 text-sm">
                Feedback system currently disabled.
              </p>
            </DynamicPanel>

            {children}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="row-start-3 py-4 text-center text-xs text-gray-500/70 border-t border-cyan-900/40">
        FILON Core v0.4 • Hotkey Focus Active
      </footer>

      {/* Performance overlay (non-intrusive, bottom-right) */}
      {!reduced && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed bottom-4 right-4 bg-neutral-900/90 backdrop-blur-sm border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-300 font-mono z-50"
          data-perf-overlay
        >
          FPS: {fps} (avg: {avg.toFixed(1)}ms)
        </motion.div>
      )}
    </motion.div>
  );
}

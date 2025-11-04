"use client";

import { motion, AnimatePresence } from "framer-motion";

interface SyncIndicatorProps {
  isSyncing: boolean;
  queueSize: number;
  className?: string;
}

export default function SyncIndicator({
  isSyncing,
  queueSize,
  className = "",
}: SyncIndicatorProps) {
  if (!isSyncing && queueSize === 0) {
    return null; // Don't show when idle and empty
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`fixed bottom-4 right-4 z-50 rounded-lg border border-zinc-800 bg-zinc-900/95 px-3 py-2 shadow-lg backdrop-blur-sm ${className}`}
      >
        <div className="flex items-center gap-2">
          {isSyncing ? (
            <>
              <div className="h-2 w-2 animate-pulse rounded-full bg-sky-400" />
              <span className="text-sm text-zinc-300">Speichern...</span>
            </>
          ) : queueSize > 0 ? (
            <>
              <div className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-sm text-zinc-300">
                {queueSize} {queueSize === 1 ? "Änderung" : "Änderungen"} wartet
              </span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-sm text-zinc-300">Synchronisiert</span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

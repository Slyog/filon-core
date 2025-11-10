"use client";

import { motion, AnimatePresence } from "framer-motion";
import { t } from "@/config/strings";

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
        className={`fixed bottom-4 right-4 z-50 rounded-lg border border-surface-active/50 bg-[hsl(var(--filon-bg-hsl))]/95 px-3 py-2 shadow-glow backdrop-blur-sm hover:shadow-glow transition-all duration-300 ease-filon ${className}`}
      >
        <div className="flex items-center gap-2">
          {isSyncing ? (
            <>
              <div className="h-2 w-2 animate-pulse rounded-full bg-sky-400" />
              <span className="text-sm text-[hsl(var(--filon-primary))]">{t.saving}</span>
            </>
          ) : queueSize > 0 ? (
            <>
              <div className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-sm text-[hsl(var(--filon-primary))]">
                {queueSize} {queueSize === 1 ? t.change : t.changes} {t.waiting}
              </span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-sm text-[hsl(var(--filon-primary))]">{t.synchronized}</span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

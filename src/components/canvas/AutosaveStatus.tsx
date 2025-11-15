"use client";

import { AnimatePresence, motion } from "framer-motion";

type AutosaveStatusProps = {
  hasUnsavedChanges: boolean;
};

export function AutosaveStatus({ hasUnsavedChanges }: AutosaveStatusProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={hasUnsavedChanges ? "unsaved" : "saved"}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="pointer-events-none absolute top-4 right-4 z-10 select-none"
        data-testid="autosave-status"
        aria-live="polite"
        role="status"
      >
        <span
          className={`text-xs font-medium tracking-wide ${
            hasUnsavedChanges
              ? "text-amber-400/90"
              : "text-filon-text/50"
          }`}
        >
          {hasUnsavedChanges ? "Unsaved changes…" : "Saved"}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}


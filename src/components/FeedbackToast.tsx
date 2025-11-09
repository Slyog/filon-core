"use client";

import { AnimatePresence, motion } from "framer-motion";

type FeedbackToastProps = {
  status: "idle" | "saving" | "success" | "error";
};

export function FeedbackToast({ status }: FeedbackToastProps) {
  const messages: Record<Exclude<FeedbackToastProps["status"], "idle">, string> =
    {
      saving: "Speichert Änderungen...",
      success: "Gespeichert ✓",
      error: "Fehler beim Speichern ⚠️",
    };

  const isActive = status !== "idle";
  const message = isActive ? messages[status] : null;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.4 }}
          data-testid="toast"
          className={`fixed bottom-4 right-4 rounded-2xl px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-md transition-colors ${
            status === "error"
              ? "bg-red-500/20 text-red-300"
              : "bg-cyan-500/20 text-cyan-200"
          }`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

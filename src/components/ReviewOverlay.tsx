"use client";

import { motion, AnimatePresence } from "framer-motion";

import type { AutosaveStatus } from "@/hooks/useAutosave";

type ReviewOverlayProps = {
  visible: boolean;
  status: AutosaveStatus;
  onCommit: () => void;
  onReject: () => void;
  onRetry: () => void;
};

function getStatusLabel(status: AutosaveStatus) {
  switch (status) {
    case "saving":
      return "Speichert Änderungen…";
    case "saved":
      return "Änderungen gespeichert ✓";
    case "error":
      return "Speichern fehlgeschlagen – bitte prüfen";
    case "offline":
      return "Offline – Änderungen werden lokal gehalten";
    default:
      return "Änderungen prüfen";
  }
}

export function ReviewOverlay({
  visible,
  status,
  onCommit,
  onReject,
  onRetry,
}: ReviewOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
          data-testid="review-overlay"
          className="ReviewOverlay fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-3 rounded-2xl bg-black/60 backdrop-blur-md px-5 py-3 text-sm text-cyan-200 shadow-xl z-50"
        >
          <span className="mr-2">{getStatusLabel(status)}</span>
          <button
            type="button"
            onClick={onCommit}
            className="rounded-xl border border-cyan-400/30 bg-cyan-500/20 px-3 py-1 text-cyan-100 transition hover:bg-cyan-500/30"
          >
            Übernehmen
          </button>
          <button
            type="button"
            onClick={onReject}
            className="rounded-xl border border-gray-400/30 bg-gray-500/20 px-3 py-1 text-gray-200 transition hover:bg-gray-500/30"
          >
            Verwerfen
          </button>
          <button
            type="button"
            onClick={onRetry}
            disabled={status !== "error"}
            className="rounded-xl border border-cyan-700/30 bg-cyan-900/20 px-3 py-1 text-cyan-100 transition hover:bg-cyan-900/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Wiederholen
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


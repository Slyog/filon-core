"use client";

import { AnimatePresence, motion } from "framer-motion";

import type { AutosaveStatus } from "@/hooks/useAutosaveState";

type FeedbackToastProps = {
  status: AutosaveStatus;
};

type StatusDescriptor = {
  label: string;
  toneClass: string;
  icon: string;
  animate: Record<string, unknown>;
  transition: Record<string, unknown>;
  exit: Record<string, unknown>;
  enterMs: number;
  exitMs: number;
};

const baseTransition = { duration: 0.35, ease: [0.22, 0.61, 0.36, 1] };

const STATUS_VARIANTS: Record<
  Exclude<AutosaveStatus, "idle">,
  StatusDescriptor
> = {
  saving: {
    label: "Saving…",
    icon: "⟳",
    toneClass:
      "border-sky-400/40 bg-sky-500/15 text-sky-100 shadow-[0_0_24px_rgba(56,189,248,0.25)]",
    animate: {
      scale: [1, 1.03, 1],
      opacity: [0.85, 1, 0.85],
      boxShadow: [
        "0 0 0px rgba(56,189,248,0.14)",
        "0 0 20px rgba(56,189,248,0.45)",
        "0 0 0px rgba(56,189,248,0.14)",
      ],
    },
    transition: {
      duration: 0.9,
      repeat: Infinity,
      ease: [0.33, 0.66, 0.41, 0.99],
    },
    exit: { opacity: 0, y: -12 },
    enterMs: 900,
    exitMs: 400,
  },
  saved: {
    label: "Saved",
    icon: "✔",
    toneClass:
      "border-emerald-400/60 bg-emerald-500/15 text-emerald-100 shadow-[0_0_26px_rgba(16,185,129,0.35)]",
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { ...baseTransition },
    exit: { opacity: 0, y: -12, transition: { duration: 0.4 } },
    enterMs: 350,
    exitMs: 400,
  },
  error: {
    label: "Retrying ↻",
    icon: "⚠",
    toneClass:
      "border-amber-400/60 bg-amber-500/20 text-amber-100 shadow-[0_0_26px_rgba(245,158,11,0.4)]",
    animate: {
      x: [0, -6, 6, -6, 0],
      opacity: 1,
      scale: 1,
    },
    transition: { duration: 0.6, ease: "easeInOut" },
    exit: { opacity: 0, y: -12 },
    enterMs: 600,
    exitMs: 400,
  },
  offline: {
    label: "Offline ⚠",
    icon: "⛔",
    toneClass:
      "border-orange-400/70 bg-orange-500/25 text-orange-100 shadow-[0_0_28px_rgba(249,115,22,0.45)]",
    animate: {
      opacity: [0.85, 1, 0.85],
      boxShadow: [
        "0 0 12px rgba(249,115,22,0.25)",
        "0 0 28px rgba(249,115,22,0.55)",
        "0 0 12px rgba(249,115,22,0.25)",
      ],
    },
    transition: {
      duration: 0.95,
      repeat: Infinity,
      ease: "easeInOut",
    },
    exit: { opacity: 0, y: -12 },
    enterMs: 950,
    exitMs: 400,
  },
};

export function FeedbackToast({ status }: FeedbackToastProps) {
  const descriptor =
    status === "idle" ? null : STATUS_VARIANTS[status];

  return (
    <AnimatePresence>
      {descriptor && (
        <motion.div
          key={status}
          data-testid="autosave-toast"
          data-status={status}
          data-enter-ms={descriptor.enterMs}
          data-exit-ms={descriptor.exitMs}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={descriptor.animate}
          transition={descriptor.transition}
          exit={descriptor.exit}
          className={`pointer-events-auto flex min-w-[220px] items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium backdrop-blur-lg ${descriptor.toneClass}`}
        >
          <span aria-hidden className="text-base">
            {descriptor.icon}
          </span>
          <span>{descriptor.label}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


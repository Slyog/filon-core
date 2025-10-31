"use client";
import { motion } from "framer-motion";

const colors: Record<string, string> = {
  saved: "text-emerald-400",
  syncing: "text-sky-400",
  error: "text-rose-400",
  conflict: "text-amber-400",
};

export default function SaveStatusBadge({ state }: { state: string }) {
  const label =
    state === "saved"
      ? "Gespeichert"
      : state === "syncing"
      ? "Synchronisiere…"
      : state === "error"
      ? "Offline – lokal gespeichert"
      : state === "conflict"
      ? "Konflikt gelöst"
      : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className={`text-sm ${colors[state] || "text-gray-400"} font-medium`}
    >
      {label}
    </motion.div>
  );
}

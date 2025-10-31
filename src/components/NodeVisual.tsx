"use client";
import { motion } from "framer-motion";

export default function NodeVisual({
  node,
  state,
}: {
  node: { data: { label?: string } };
  state?: string;
}) {
  const pulseColor =
    state === "syncing"
      ? "shadow-cyan-400/60"
      : state === "conflict"
      ? "shadow-amber-400/60"
      : state === "merged"
      ? "shadow-emerald-400/60"
      : "shadow-transparent";

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.03 }}
      animate={{
        boxShadow: `0 0 12px ${pulseColor}`,
        transition: { duration: 0.4, ease: "easeInOut" },
      }}
      className="rounded-xl bg-zinc-900 text-zinc-100 px-4 py-2"
    >
      <p className="text-sm font-medium">{node.data?.label || "Node"}</p>
    </motion.div>
  );
}

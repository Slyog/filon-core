"use client";
import { motion } from "framer-motion";

interface SessionBadgeProps {
  status: "active" | "saving" | "idle";
}

export default function SessionBadge({ status }: SessionBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "active":
        return {
          text: "🟢 Active",
          color: "text-emerald-400",
          glow: "0 0 16px rgba(74, 222, 128, 0.5)",
        };
      case "saving":
        return {
          text: "💾 Saving...",
          color: "text-amber-400",
          glow: "0 0 16px rgba(251, 191, 36, 0.5)",
        };
      case "idle":
      default:
        return {
          text: "⚪ Idle",
          color: "text-zinc-500",
          glow: "none",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-700"
      style={{ boxShadow: config.glow }}
    >
      {/* Pulse animation for saving status */}
      {status === "saving" && (
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-full h-full rounded-full bg-amber-400/20 pointer-events-none"
        />
      )}
      <span className={`text-xs font-semibold ${config.color} relative z-10`}>
        {config.text}
      </span>
    </motion.div>
  );
}

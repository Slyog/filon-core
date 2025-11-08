"use client";

import { AnimatePresence, motion } from "framer-motion";

type ReviewOverlayProps = {
  status: "idle" | "saving" | "success" | "error";
  visible?: boolean;
};

export function ReviewOverlay({
  status,
  visible = true,
}: ReviewOverlayProps) {
  const active = visible && status !== "idle";

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="ReviewOverlay fixed bottom-6 right-6 bg-neutral-900/80 text-cyan-300 px-4 py-2 rounded-2xl shadow-lg backdrop-blur-md transition-all duration-500"
        >
          {status === "saving" && "Saving..."}
          {status === "success" && "Saved ✓"}
          {status === "error" && "Offline – retrying..."}
        </motion.div>
      )}
    </AnimatePresence>
  );
}


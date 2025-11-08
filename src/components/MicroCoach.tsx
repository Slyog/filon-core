"use client";

import { AnimatePresence, motion } from "framer-motion";

type MicroCoachProps = {
  message: string | null;
};

export function MicroCoach({ message }: MicroCoachProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="MicroCoachTooltip pointer-events-none absolute bottom-20 right-6 max-w-xs rounded-xl border border-cyan-300/30 bg-[#0B1116]/90 px-4 py-3 text-sm text-cyan-100 shadow-lg backdrop-blur-md"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}


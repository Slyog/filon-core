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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="pointer-events-none absolute bottom-24 left-1/2 max-w-sm -translate-x-1/2 rounded-full bg-black/30 px-4 py-2 text-xs text-cyan-400/80 shadow-lg backdrop-blur-md"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}


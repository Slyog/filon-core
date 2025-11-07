"use client";

import { motion } from "framer-motion";
import { useUIState } from "@/store/uiState";

export const LoadingOverlay = () => {
  const { isLoading } = useUIState();

  if (!isLoading) return null;

  const steps = ["Thinking…", "Building Graph…", "Almost there…"];

  return (
    <motion.div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-[hsl(var(--filon-bg)/0.9)] backdrop-blur-sm text-[hsl(var(--filon-accent))]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        key={steps[0]}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-xl font-medium tracking-wide"
      >
        {steps[Math.floor(Date.now() / 2000) % steps.length]}
      </motion.div>
    </motion.div>
  );
};


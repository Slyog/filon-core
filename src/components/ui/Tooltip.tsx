"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, ReactNode } from "react";

type TooltipProps = {
  label: string;
  children: ReactNode;
};

export default function Tooltip({ label, children }: TooltipProps) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
      <AnimatePresence>
        {hover && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-gray-100 shadow-md border border-cyan-700/40"
            role="tooltip"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


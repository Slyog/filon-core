"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface QuickChip {
  label: string;
  command: string;
  description: string;
}

const QUICK_CHIPS: QuickChip[] = [
  {
    label: "Ziel hinzufügen",
    command: "/goal",
    description: "Neues Ziel erstellen",
  },
  {
    label: "Verknüpfen",
    command: "/link",
    description: "Gedanken verknüpfen",
  },
  {
    label: "Erklären",
    command: "/explain",
    description: "AI-Erklärung anfordern",
  },
  {
    label: "Markieren",
    command: "/mark",
    description: "Als wichtig markieren",
  },
];

interface QuickChipsProps {
  onChipClick: (command: string) => void;
}

export default function QuickChips({ onChipClick }: QuickChipsProps) {
  const reduced = useReducedMotion();

  return (
    <div
      role="group"
      aria-label="Schnellaktionen"
      className="flex flex-wrap gap-2 px-4 pb-3"
    >
      {QUICK_CHIPS.map((chip) => (
        <motion.button
          key={chip.command}
          type="button"
          role="button"
          aria-label={chip.description}
          aria-description={`Prefill Brainbar mit ${chip.command}`}
          onClick={() => onChipClick(chip.command)}
          className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-medium border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors focus-glow"
          whileHover={reduced ? {} : { scale: 1.05 }}
          whileTap={reduced ? {} : { scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 22,
          }}
        >
          {chip.label}
        </motion.button>
      ))}
    </div>
  );
}


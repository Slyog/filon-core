"use client";

import { motion, useReducedMotion } from "framer-motion";
import { t } from "@/config/strings";

type ChipCommand = "/add" | "/link" | "/goal" | "/due" | "/explain" | "/mark";

interface QuickChipsProps {
  onPick: (command: ChipCommand) => void;
}

const CHIPS: Array<{ label: string; command: ChipCommand; helper: string }> = [
  { label: t.addGoal, command: "/goal", helper: t.goalNote },
  { label: t.link, command: "/link", helper: t.discoverConnections },
  { label: t.explain, command: "/explain", helper: t.requestExplanation },
  { label: t.mark, command: "/mark", helper: t.markThought },
];

export default function QuickChips({ onPick }: QuickChipsProps) {
  const reduced = useReducedMotion();

  return (
    <div
      role="group"
      aria-label={t.quickActions}
      className="flex flex-wrap gap-2"
    >
      {CHIPS.map((chip) => (
        <motion.button
          key={chip.command}
          type="button"
          aria-pressed="false"
          aria-label={chip.label}
          aria-description={chip.helper}
          data-testid={`quickchip-${chip.command}`}
          className="focus-glow rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-sm font-medium text-cyan-100 hover:bg-cyan-500/20 focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
          whileHover={reduced ? undefined : { scale: 1.05 }}
          whileTap={reduced ? undefined : { scale: 0.95 }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
          onClick={() => onPick(chip.command)}
        >
          {chip.label}
        </motion.button>
      ))}
    </div>
  );
}

"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useUIState } from "@/store/uiState";
import { useSettings } from "@/store/settings";
import { useAutoFocusScroll } from "@/hooks/useAutoFocusScroll";

export const Panel = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { activePanelId, setActivePanel } = useUIState();
  const { glowIntensity, animationSpeed } = useSettings();
  const isActive = activePanelId === id;
  const ref = useRef<HTMLDivElement>(null);

  useAutoFocusScroll(ref, isActive, 1000 * animationSpeed);

  return (
    <motion.div
      ref={ref}
      layout
      onClick={() => setActivePanel(id)}
      onMouseEnter={() => setActivePanel(id)}
      onMouseLeave={() => setActivePanel(null)}
      transition={{ type: "spring", stiffness: 120 * animationSpeed, damping: 22 }}
      animate={{
        scale: isActive ? 1.05 : 1,
        y: isActive ? -10 : 0,
        zIndex: isActive ? 30 : 5,
        boxShadow: isActive
          ? `0 0 ${14 * glowIntensity}px hsl(var(--filon-accent)/0.9)`
          : `0 0 ${6 * glowIntensity}px hsl(var(--filon-glow)/0.4)`,
      }}
      className="relative rounded-xl bg-[hsl(var(--filon-bg)/0.9)] backdrop-blur-sm p-4 transition-colors"
    >
      {children}
    </motion.div>
  );
};


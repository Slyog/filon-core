"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { useGlowIntensity } from "@/hooks/useGlowIntensity";

interface ContextStreamPanelProps extends HTMLMotionProps<"div"> {
  children?: React.ReactNode;
  id?: string;
  activeId?: string;
}

export const ContextStreamPanel = ({
  children,
  id,
  activeId,
  ...props
}: ContextStreamPanelProps) => {
  const level = useGlowIntensity(activeId || "", id || "");
  const z = level === "high" ? "z-focus" : "z-base";
  const glow = level === "high" ? "shadow-glow-high" : "shadow-glow-low";

  return (
    <motion.div
      className={`relative ${glow} ${z} rounded-2xl backdrop-blur-sm bg-[hsl(var(--filon-bg)/0.95)] transition-all duration-300 ease-filon p-4`}
      whileHover={{ scale: 1.03 }}
      layout
      {...props}
    >
      {children}
    </motion.div>
  );
};


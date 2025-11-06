"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEnergySync } from "@/hooks/useEnergySync";

export const InteractiveLight = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const energy = useEnergySync(); // 0 – 1
  const sx = useSpring(x, { stiffness: 80, damping: 20 });
  const sy = useSpring(y, { stiffness: 80, damping: 20 });

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-overlay"
      style={{
        background: `radial-gradient(
          600px circle at ${sx}px ${sy}px,
          hsl(var(--filon-glow)/${0.25 + energy * 0.35}),
          transparent 80%
        )`,
        mixBlendMode: "screen",
        filter: `brightness(${1 + energy * 0.3}) saturate(${1 + energy * 0.2})`,
      }}
      onPointerMove={(e) => {
        x.set(e.clientX);
        y.set(e.clientY);
      }}
    />
  );
};


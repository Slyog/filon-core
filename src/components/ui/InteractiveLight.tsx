"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEnergySync } from "@/hooks/useEnergySync";
import { useInactivity } from "@/hooks/useInactivity";

export const InteractiveLight = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const energy = useEnergySync(); // 0 – 1
  const inactive = useInactivity(15000);
  const sx = useSpring(x, { stiffness: 80, damping: 20 });
  const sy = useSpring(y, { stiffness: 80, damping: 20 });

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-overlay"
      style={{
        background: `radial-gradient(
          600px circle at ${sx}px ${sy}px,
          hsl(var(--filon-glow)/${inactive ? 0.1 : 0.25 + energy * 0.35}),
          transparent 80%
        )`,
        mixBlendMode: "screen",
        filter: inactive
          ? "brightness(0.8) saturate(0.8) blur(2px)"
          : `brightness(${1 + energy * 0.3}) saturate(${1 + energy * 0.2})`,
        transition: "filter 1.5s ease, background 1.5s ease",
      }}
      onPointerMove={(e) => {
        x.set(e.clientX);
        y.set(e.clientY);
      }}
    />
  );
};


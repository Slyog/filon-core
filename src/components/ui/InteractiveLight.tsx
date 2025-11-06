"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";

export const InteractiveLight = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 80, damping: 20 });
  const sy = useSpring(y, { stiffness: 80, damping: 20 });

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-overlay"
      style={{
        background: `radial-gradient(
          600px circle at ${sx}px ${sy}px,
          hsl(var(--filon-glow)/0.25),
          transparent 80%
        )`,
        mixBlendMode: "screen",
      }}
      onPointerMove={(e) => {
        x.set(e.clientX);
        y.set(e.clientY);
      }}
    />
  );
};


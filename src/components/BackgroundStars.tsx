"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

const STAR_COUNT = 80;

function createSeededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

export default function BackgroundStars() {
  const stars = useMemo(() => {
    const random = createSeededRandom(8723);

    return Array.from({ length: STAR_COUNT }, () => ({
      top: random() * 100,
      left: random() * 100,
      size: 1.5 + random() * 2,
      duration: 3 + random() * 3,
      delay: random() * 4,
    }));
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={{
        background: `radial-gradient(circle at top, rgba(47,243,255,0.1), transparent 65%), url('/noise.png')`,
        opacity: 0.1,
      }}
    >
      {stars.map((star, index) => (
        <motion.span
          key={`star-${index}`}
          className="absolute rounded-full bg-cyan-200/30"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
          animate={{ opacity: [0.15, 0.6, 0.25] }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            repeatType: "reverse",
            delay: star.delay,
          }}
        />
      ))}
    </div>
  );
}


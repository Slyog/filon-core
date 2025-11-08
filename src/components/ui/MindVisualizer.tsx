"use client";

import { useRef, useEffect } from "react";
import { useEnergySync } from "@/hooks/useEnergySync";
import { useInactivity } from "@/hooks/useInactivity";
import { useSettings } from "@/store/settings";

export const MindVisualizer = () => {
  const glowIntensity = useSettings((s) => s.glowIntensity);
  const animationSpeed = useSettings((s) => s.animationSpeed);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const energy = useEnergySync();
  const inactive = useInactivity(15000);

  useEffect(() => {
    // Skip effect when glow is disabled
    if (glowIntensity <= 0.05) {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
    }));

    let animationFrameId: number;

    function draw() {
      if (!ctx) return;

      ctx.fillStyle = `rgba(10,20,25,0.15)`;
      ctx.fillRect(0, 0, width, height);

      const speedMultiplier = animationSpeed > 0.05 ? animationSpeed : 0;
      particles.forEach((p) => {
        p.x += p.vx * (0.2 + energy * 0.5) * speedMultiplier;
        p.y += p.vy * (0.2 + energy * 0.5) * speedMultiplier;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const hue = 180 + energy * 60;
        const alpha = inactive ? 0.3 : 0.6 + energy * 0.4;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
        ctx.arc(p.x, p.y, p.size * (1 + energy), 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [energy, inactive, animationSpeed, glowIntensity]);

  // Skip rendering when glow is disabled
  if (glowIntensity <= 0.05) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[1] opacity-60 mix-blend-screen"
    />
  );
};

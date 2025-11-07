"use client";

import { useRef, useEffect } from "react";
import { useEnergySync } from "@/hooks/useEnergySync";
import { useInactivity } from "@/hooks/useInactivity";

export const MindVisualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const energy = useEnergySync();
  const inactive = useInactivity(15000);

  useEffect(() => {
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
      const brightness = inactive ? 0.15 : 0.25 + energy * 0.35;
      ctx.fillStyle = `rgba(10,20,25,0.15)`;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx * (1 + energy * 2);
        p.y += p.vy * (1 + energy * 2);
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
  }, [energy, inactive]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[1] opacity-60 mix-blend-screen"
    />
  );
};


import { useState, useEffect, useRef } from "react";

export interface FramePerfResult {
  fps: number;
  avg: number;
}

/**
 * Hook measures frame delta and reports fps average.
 * Optimized for performance monitoring with exponential moving average.
 */
export function useFramePerf(): FramePerfResult {
  const [fps, setFps] = useState(60);
  const avg = useRef(16);
  const frameCount = useRef(0);

  useEffect(() => {
    let prev = performance.now();
    let rafId: number;

    const loop = () => {
      const now = performance.now();
      const delta = now - prev;
      frameCount.current++;

      // Exponential moving average (90% old, 10% new)
      avg.current = avg.current * 0.9 + delta * 0.1;

      // Update FPS every 60 frames (approximately once per second at 60fps)
      if (frameCount.current % 60 === 0) {
        setFps(Math.round(1000 / avg.current));
      }

      prev = now;
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return { fps, avg: avg.current };
}


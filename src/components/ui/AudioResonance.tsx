"use client";

import { useEffect, useRef } from "react";
import { useEnergySync } from "@/hooks/useEnergySync";
import { useInactivity } from "@/hooks/useInactivity";

export const AudioResonance = () => {
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const energy = useEnergySync();
  const inactive = useInactivity(15000);

  useEffect(() => {
    if (!ctxRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      ctxRef.current = ctx;
      oscRef.current = osc;
      gainRef.current = gain;
    }

    const ctx = ctxRef.current!;
    const osc = oscRef.current!;
    const gain = gainRef.current!;

    // leichte Reaktion auf Aktivität
    const freq = 80 + energy * 160; // 80–240 Hz
    const vol = inactive ? 0.03 : 0.08 + energy * 0.07;
    const detune = Math.sin(performance.now() / 2000) * 10;

    osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.5);
    osc.detune.setTargetAtTime(detune, ctx.currentTime, 0.5);
    gain.gain.setTargetAtTime(vol, ctx.currentTime, 1.2);

    return () => {};
  }, [energy, inactive]);

  return null;
};


import { useState, useEffect } from "react";

export function useEnergySync() {
  const [energy, setEnergy] = useState(0);

  useEffect(() => {
    const boost = () => setEnergy((e) => Math.min(e + 0.2, 1));
    const decay = setInterval(() => setEnergy((e) => Math.max(e - 0.01, 0)), 50);

    window.addEventListener("keydown", boost);
    window.addEventListener("pointerdown", boost);
    window.addEventListener("wheel", boost, { passive: true });

    return () => {
      window.removeEventListener("keydown", boost);
      window.removeEventListener("pointerdown", boost);
      window.removeEventListener("wheel", boost);
      clearInterval(decay);
    };
  }, []);

  return energy;
}


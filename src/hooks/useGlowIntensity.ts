import { useState, useEffect } from "react";

export function useGlowIntensity(activeId: string, id: string) {
  const [level, setLevel] = useState("low");

  useEffect(() => {
    setLevel(activeId === id ? "high" : "low");
  }, [activeId, id]);

  return level;
}


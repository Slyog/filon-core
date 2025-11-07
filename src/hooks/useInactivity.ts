import { useState, useEffect } from "react";

export function useInactivity(timeout = 15000) {
  const [inactive, setInactive] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const reset = () => {
      clearTimeout(timer);
      setInactive(false);
      timer = setTimeout(() => setInactive(true), timeout);
    };

    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    window.addEventListener("wheel", reset);
    window.addEventListener("pointerdown", reset);
    reset();

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
      window.removeEventListener("wheel", reset);
      window.removeEventListener("pointerdown", reset);
    };
  }, [timeout]);

  return inactive;
}


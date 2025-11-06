/**
 * FILON Step 16.9 - Theme Polish Hook
 * Hook for global color and motion preferences
 */

import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

export function useThemePolish() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Read prefers-color-scheme
    if (typeof window !== "undefined") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");

      // Read prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setReducedMotion(prefersReducedMotion);

      // Apply classes dynamically
      const root = document.documentElement;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      if (prefersReducedMotion) {
        root.classList.add("motion-soft");
      } else {
        root.classList.remove("motion-soft");
      }

      // Listen for changes
      const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const motionMediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

      const handleDarkChange = (e: MediaQueryListEvent) => {
        setTheme(e.matches ? "dark" : "light");
        if (e.matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      };

      const handleMotionChange = (e: MediaQueryListEvent) => {
        setReducedMotion(e.matches);
        if (e.matches) {
          root.classList.add("motion-soft");
        } else {
          root.classList.remove("motion-soft");
        }
      };

      darkMediaQuery.addEventListener("change", handleDarkChange);
      motionMediaQuery.addEventListener("change", handleMotionChange);

      return () => {
        darkMediaQuery.removeEventListener("change", handleDarkChange);
        motionMediaQuery.removeEventListener("change", handleMotionChange);
      };
    }
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setTheme(mode);
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      if (mode === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  return {
    theme,
    reducedMotion,
    setTheme: setThemeMode,
  };
}


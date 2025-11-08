"use client";

import { useEffect } from "react";
import "@/app/globals.css";
import AppShell from "@/components/shell/AppShell";
import { applyVisualSettings, useSettings } from "@/store/settings";

function ReducedMotionHandler() {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => {
      if (mediaQuery.matches) {
        document.documentElement.setAttribute("data-reduced-motion", "true");
      } else {
        document.documentElement.removeAttribute("data-reduced-motion");
      }
    };
    updateReducedMotion();
    mediaQuery.addEventListener("change", updateReducedMotion);
    return () => mediaQuery.removeEventListener("change", updateReducedMotion);
  }, []);
  return null;
}

function VisualSettingsHandler() {
  const animationSpeed = useSettings((state) => state.animationSpeed);
  const glowIntensity = useSettings((state) => state.glowIntensity);

  useEffect(() => {
    applyVisualSettings(animationSpeed, glowIntensity);
  }, [animationSpeed, glowIntensity]);

  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="h-full w-full overflow-hidden bg-[#050b10] text-white">
        <ReducedMotionHandler />
        <VisualSettingsHandler />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import "@/app/globals.css";
import { InteractiveLight } from "@/components/ui/InteractiveLight";
import { MindVisualizer } from "@/components/ui/MindVisualizer";
import { AudioResonance } from "@/components/ui/AudioResonance";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { SettingsDrawer } from "@/components/ui/SettingsDrawer";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="h-full w-full overflow-hidden bg-[#0e0f12] text-white">
        <ReducedMotionHandler />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <InteractiveLight />
          <MindVisualizer />
          <AudioResonance />
          <LoadingOverlay />
          <SettingsDrawer />
        </ThemeProvider>
      </body>
    </html>
  );
}

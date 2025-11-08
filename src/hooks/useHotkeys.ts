"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUISettingsStore } from "@/store/uiSettingsStore";

const COMMAND_PALETTE_EVENT = "filon:command-palette:toggle";

export function useHotkeys() {
  const pathname = usePathname();
  const toggleSidebarPeek = useUISettingsStore((state) => state.toggleSidebarPeek);
  const closeSidebarPeek = useUISettingsStore((state) => state.closeSidebarPeek);
  const showSidebarPeek = useUISettingsStore((state) => state.showSidebarPeek);

  useEffect(() => {
    if (pathname !== "/" && showSidebarPeek) {
      closeSidebarPeek();
    }
  }, [pathname, showSidebarPeek, closeSidebarPeek]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;

      if (isCmdOrCtrl && key === "k") {
        event.preventDefault();
        if (pathname === "/") {
          toggleSidebarPeek();
        } else {
          window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_EVENT));
        }
        return;
      }

      if (key === "escape" && pathname === "/" && useUISettingsStore.getState().showSidebarPeek) {
        event.preventDefault();
        closeSidebarPeek();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [pathname, toggleSidebarPeek, closeSidebarPeek]);
}

export function registerCommandPaletteListener(listener: () => void) {
  window.addEventListener(COMMAND_PALETTE_EVENT, listener);
  return () => window.removeEventListener(COMMAND_PALETTE_EVENT, listener);
}


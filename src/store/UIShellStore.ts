"use client";

import { create } from "zustand";
import { useEffect } from "react";

type UIShellState = {
  sidebarOpen: boolean;
  hydrated: boolean;
  setSidebarOpen: (value: boolean) => void;
  toggleSidebar: () => void;
};

const STORAGE_KEY = "filon:sidebarOpen";

export const useUIShellStore = create<UIShellState>((set, get) => ({
  sidebarOpen: true,
  hydrated: false,
  setSidebarOpen: (value: boolean) => {
    set({ sidebarOpen: value });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(value));
    }
  },
  toggleSidebar: () => {
    const next = !get().sidebarOpen;
    set({ sidebarOpen: next });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    }
  },
}));

export function useHydrateUIShell() {
  const hydrated = useUIShellStore((state) => state.hydrated);

  useEffect(() => {
    if (hydrated) return;

    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(STORAGE_KEY);
    const sidebarOpen = raw === null ? true : raw === "true";

    useUIShellStore.setState({
      sidebarOpen,
      hydrated: true,
    });
  }, [hydrated]);
}

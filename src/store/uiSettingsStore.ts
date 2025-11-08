"use client";

import { create } from "zustand";

type UISettingsState = {
  showSidebarPeek: boolean;
  setShowSidebarPeek: (value: boolean) => void;
  toggleSidebarPeek: () => void;
  closeSidebarPeek: () => void;
};

export const useUISettingsStore = create<UISettingsState>((set) => ({
  showSidebarPeek: false,
  setShowSidebarPeek: (value) => set({ showSidebarPeek: value }),
  toggleSidebarPeek: () =>
    set((state) => ({ showSidebarPeek: !state.showSidebarPeek })),
  closeSidebarPeek: () => set({ showSidebarPeek: false }),
}));


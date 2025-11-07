"use client";

import { create } from "zustand";

interface UIState {
  isLoading: boolean;
  activePanelId: string | null;
  setState: (state: Partial<UIState>) => void;
  setActivePanel: (id: string | null) => void;
}

export const useUIState = create<UIState>((set) => ({
  isLoading: false,
  activePanelId: null,
  setState: (newState) => set((state) => ({ ...state, ...newState })),
  setActivePanel: (id: string | null) => set({ activePanelId: id }),
}));


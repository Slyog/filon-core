"use client";

import { create } from "zustand";

interface UIState {
  isLoading: boolean;
  setState: (state: Partial<UIState>) => void;
}

export const useUIState = create<UIState>((set) => ({
  isLoading: false,
  setState: (newState) => set((state) => ({ ...state, ...newState })),
}));


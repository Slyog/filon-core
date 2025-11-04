import { create } from "zustand";

interface PanelFocusState {
  activePanel: string | null;
  setActivePanel: (panel: string) => void;
}

export const usePanelFocus = create<PanelFocusState>((set) => ({
  activePanel: null,
  setActivePanel: (panel) => set({ activePanel: panel }),
}));


import { create } from "zustand";
import { FEATURE_FLAGS } from "@/config/featureFlags";

export type PanelInfo = {
  key: keyof typeof FEATURE_FLAGS;
  title: string;
  active: boolean;
};

interface PanelRegistryState {
  panels: PanelInfo[];
  register: (key: PanelInfo["key"], title: string) => void;
  refresh: () => void;
}

export const usePanelRegistry = create<PanelRegistryState>((set, get) => ({
  panels: [],
  register: (key, title) => {
    const exists = get().panels.find((p) => p.key === key);
    if (!exists)
      set((state) => ({
        panels: [
          ...state.panels,
          { key, title, active: FEATURE_FLAGS[key] ?? false },
        ],
      }));
  },
  refresh: () =>
    set((state) => ({
      panels: state.panels.map((p) => ({
        ...p,
        active: FEATURE_FLAGS[p.key] ?? false,
      })),
    })),
}));

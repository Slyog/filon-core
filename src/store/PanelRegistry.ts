import { create } from "zustand";
import { FEATURE_FLAGS } from "@/config/featureFlags";

export type PanelEntry = {
  key: keyof typeof FEATURE_FLAGS;
  title: string;
  active: boolean;
};

interface PanelRegistryState {
  panels: PanelEntry[];
  refresh: () => void;
}

export const usePanelRegistry = create<PanelRegistryState>((set) => ({
  panels: Object.keys(FEATURE_FLAGS).map((key) => ({
    key: key as keyof typeof FEATURE_FLAGS,
    title: key.replaceAll("_", " "),
    active: FEATURE_FLAGS[key as keyof typeof FEATURE_FLAGS],
  })),
  refresh: () =>
    set({
      panels: Object.keys(FEATURE_FLAGS).map((key) => ({
        key: key as keyof typeof FEATURE_FLAGS,
        title: key.replaceAll("_", " "),
        active: FEATURE_FLAGS[key as keyof typeof FEATURE_FLAGS],
      })),
    }),
}));

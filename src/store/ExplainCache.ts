import { create } from "zustand";
import localforage from "localforage";

type ExplainEntry = {
  title: string;
  summary: string;
  confidence: number;
  timestamp: number;
};

interface ExplainCacheState {
  cache: Record<string, ExplainEntry>;
  loadCache: () => Promise<void>;
  saveEntry: (key: string, entry: ExplainEntry) => Promise<void>;
  getEntry: (key: string) => ExplainEntry | null;
}

export const useExplainCache = create<ExplainCacheState>((set, get) => ({
  cache: {},
  loadCache: async () => {
    const stored = await localforage.getItem<Record<string, ExplainEntry>>(
      "explain-cache"
    );
    if (stored) set({ cache: stored });
  },
  saveEntry: async (key, entry) => {
    const updated = { ...get().cache, [key]: entry };
    set({ cache: updated });
    await localforage.setItem("explain-cache", updated);
  },
  getEntry: (key) => get().cache[key] ?? null,
}));

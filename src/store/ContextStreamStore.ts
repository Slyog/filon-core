import { create } from "zustand";
import localforage from "localforage";
import type { AISummary } from "@/ai/summarizerCore";

interface ContextStreamState {
  summaries: AISummary[];
  addSummary: (summary: AISummary) => Promise<void>;
  loadSummaries: () => Promise<void>;
  startDecay: () => void;
  stopDecay: () => void;
}

const decayRate = 0.002; // pro Sekunde
const interval = 10000; // 10s Ticks

let decayTimer: NodeJS.Timeout | null = null;

export const useContextStreamStore = create<ContextStreamState>((set, get) => ({
  summaries: [],
  addSummary: async (summary) => {
    const updated = [...get().summaries, summary];
    set({ summaries: updated });
    await localforage.setItem("context-stream-summaries", updated);
  },
  loadSummaries: async () => {
    const stored = await localforage.getItem<AISummary[]>(
      "context-stream-summaries"
    );
    if (stored) set({ summaries: stored });
  },
  startDecay: () => {
    if (decayTimer) return;
    decayTimer = setInterval(() => {
      set((state) => {
        const updated = state.summaries.map((s) => ({
          ...s,
          confidence: Math.max(0.5, s.confidence - decayRate),
        }));
        // Persistiere nach jedem Decay-Tick
        localforage.setItem("context-stream-summaries", updated);
        return { summaries: updated };
      });
    }, interval);
  },
  stopDecay: () => {
    if (decayTimer) {
      clearInterval(decayTimer);
      decayTimer = null;
    }
  },
}));

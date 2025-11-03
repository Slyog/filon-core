import { create } from "zustand";

interface MemorySnapshot {
  id: string;
  timestamp: number;
  summary: string;
  nodes: number;
  edges: number;
}

interface MemoryState {
  history: MemorySnapshot[];
  addSnapshot: (s: MemorySnapshot) => void;
  getTrend: () => string;
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  history: [],
  addSnapshot: (s) =>
    set((st) => ({ history: [...st.history.slice(-9), s] })), // keep last 10
  getTrend: () => {
    const h = get().history;
    if (h.length < 2) return "Noch keine Trends.";
    const diff = h[h.length - 1].nodes - h[h.length - 2].nodes;
    if (diff > 5) return "🚀 Graph wächst schnell";
    if (diff > 0) return "🌱 Langsames Wachstum";
    if (diff === 0) return "⚖️ Stabile Phase";
    return "🌀 Fokus verlagert – Nodes reduziert";
  },
}));

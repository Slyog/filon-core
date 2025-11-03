import { create } from "zustand";

type Feedback = {
  id: string;
  type: "success" | "error" | "info" | "sync";
  message: string;
  timestamp: number;
};

interface FeedbackState {
  items: Feedback[];
  add: (msg: Omit<Feedback, "id" | "timestamp">) => void;
  clear: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  items: [],
  add: (msg) =>
    set((s) => ({
      items: [
        ...s.items,
        { ...msg, id: crypto.randomUUID(), timestamp: Date.now() },
      ].slice(-5), // keep last 5
    })),
  clear: () => set({ items: [] }),
}));

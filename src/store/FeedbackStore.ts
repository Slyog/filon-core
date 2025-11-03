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
  // Autosave status tracking
  status: "idle" | "saving" | "synced" | "offline";
  lastSync: number | null;
  message: string;
  setStatus: (
    s: "idle" | "saving" | "synced" | "offline",
    msg?: string
  ) => void;
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
  // Autosave status fields
  status: "idle",
  lastSync: null,
  message: "",
  setStatus: (status, msg = "") =>
    set({
      status,
      message: msg,
      lastSync: status === "synced" ? Date.now() : null,
    }),
}));

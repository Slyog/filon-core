import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type QAStatus = "success" | "error" | "info";

export type QAEntry = {
  id: string; // uuid
  step?: string; // e.g., "autosave" | "export" | "commit"
  status: QAStatus;
  notes?: string;
  timestamp: number; // Date.now()
  meta?: Record<string, any>;
};

export interface QAState {
  entries: QAEntry[];
  addEntry: (
    e: Omit<QAEntry, "id" | "timestamp"> & Partial<Pick<QAEntry, "timestamp">>
  ) => QAEntry;
  listEntries: () => QAEntry[];
  clear: () => void;
}

// UUID fallback for environments without crypto.randomUUID
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const MAX_ENTRIES = 1000;

export const useQAStore = create<QAState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (entry) => {
        const newEntry: QAEntry = {
          id: generateUUID(),
          timestamp: entry.timestamp ?? Date.now(),
          ...entry,
        };

        set((state) => {
          const updated = [newEntry, ...state.entries].slice(0, MAX_ENTRIES);
          return { entries: updated };
        });

        return newEntry;
      },
      listEntries: () => {
        return get().entries;
      },
      clear: () => {
        set({ entries: [] });
      },
    }),
    {
      name: "filon.qa",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
    }
  )
);

// Export getState for use in non-React contexts (logger)
export const getQAState = () => useQAStore.getState();

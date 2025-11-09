"use client";

import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import localforage from "localforage";
import type { StreamEntry, BrainCommandType } from "@/types/brain";

type StreamState = {
  entries: StreamEntry[];
  hydrated: boolean;
  addEntry: (
    payload: {
      nodeId: string;
      text: string;
      intent: BrainCommandType;
    } & Partial<Pick<StreamEntry, "id" | "createdAt">>
  ) => StreamEntry;
  removeEntry: (id: string) => void;
  clear: () => void;
  markHydrated: () => void;
};

type PersistedStreamState = Pick<StreamState, "entries">;

const STREAM_STORAGE_KEY = "filon.brain.stream";
const MAX_STREAM_ENTRIES = 60;

const streamStorage: PersistStorage<PersistedStreamState> = {
  getItem: async (name) => {
    const stored = await localforage.getItem<{
      state: PersistedStreamState;
      version?: number;
    }>(name);
    if (!stored) return null;
    return {
      state: stored.state,
      version: stored.version ?? 0,
    };
  },
  setItem: async (name, value) => {
    await localforage.setItem(name, value);
  },
  removeItem: (name) => localforage.removeItem(name),
};

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `stream_${Math.random().toString(36).slice(2, 12)}`;
};

export const useStreamState = create<StreamState>()(
  persist(
    (set, get) => ({
      entries: [],
      hydrated: typeof window === "undefined" ? true : false,
      addEntry: ({ nodeId, text, intent, id, createdAt }) => {
        const entry: StreamEntry = {
          id: id ?? generateId(),
          nodeId,
          text,
          intent,
          createdAt: createdAt ?? Date.now(),
        };
        set((state) => {
          const existingIndex = state.entries.findIndex(
            (item) => item.nodeId === entry.nodeId
          );
          const withoutDuplicate =
            existingIndex === -1
              ? state.entries
              : state.entries.filter((_, index) => index !== existingIndex);

          const nextEntries = [entry, ...withoutDuplicate].slice(
            0,
            MAX_STREAM_ENTRIES
          );
          return { entries: nextEntries };
        });
        return entry;
      },
      removeEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        }));
      },
      clear: () => set({ entries: [] }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: STREAM_STORAGE_KEY,
      storage: streamStorage,
      partialize: (state) => ({ entries: state.entries }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);


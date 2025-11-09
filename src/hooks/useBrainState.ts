"use client";

import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import localforage from "localforage";
import type {
  BrainCommandType,
  BrainError,
  BrainNode,
} from "@/types/brain";
import { useStreamState } from "@/hooks/useStreamState";

type BrainState = {
  nodes: BrainNode[];
  activeNodeId: string | null;
  hydrated: boolean;
  lastError: BrainError | null;
  addNode: (
    text: string,
    intent: BrainCommandType,
    options?: { sessionId?: string }
  ) => Promise<
    | { ok: true; node: BrainNode }
    | { ok: false; error: BrainError }
  >;
  removeNode: (id: string) => void;
  setActiveNode: (id: string | null) => void;
  clearError: () => void;
  markHydrated: () => void;
};

type PersistedBrainState = Pick<BrainState, "nodes" | "activeNodeId">;

const BRAIN_STORAGE_KEY = "filon.brain.state";
const MAX_BRAIN_NODES = 240;

const brainStorage: PersistStorage<PersistedBrainState> = {
  getItem: async (name) => {
    const stored = await localforage.getItem<{
      state: PersistedBrainState;
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

const generateNodeId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `node_${Math.random().toString(36).slice(2, 12)}`;
};

export const useBrainState = create<BrainState>()(
  persist(
    (set, get) => ({
      nodes: [],
      activeNodeId: null,
      hydrated: typeof window === "undefined" ? true : false,
      lastError: null,
      addNode: async (text, intent, options) => {
        const trimmed = text.trim();
        if (!trimmed) {
          const error: BrainError = {
            code: "empty_input",
            message: "Please enter a thought before submitting.",
          };
          set({ lastError: error });
          return { ok: false, error };
        }

        const duplicate = get().nodes.find(
          (node) => node.text.toLowerCase() === trimmed.toLowerCase()
        );
        if (duplicate) {
          const error: BrainError = {
            code: "duplicate",
            message: "This thought already exists in your canvas.",
            value: duplicate.text,
          };
          set({ lastError: error, activeNodeId: duplicate.id });
          return { ok: false, error };
        }

        const node: BrainNode = {
          id: generateNodeId(),
          text: trimmed,
          intent,
          createdAt: Date.now(),
          sessionId: options?.sessionId,
        };

        set((state) => {
          const nextNodes = [node, ...state.nodes].slice(0, MAX_BRAIN_NODES);
          return {
            nodes: nextNodes,
            activeNodeId: node.id,
            lastError: null,
          };
        });

        // Mirror to context stream
        try {
          useStreamState
            .getState()
            .addEntry({ nodeId: node.id, text: node.text, intent: node.intent });
        } catch (error) {
          console.warn("[useBrainState] Failed to mirror to stream", error);
        }

        return { ok: true, node };
      },
      removeNode: (id) => {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== id),
          activeNodeId:
            state.activeNodeId === id ? null : state.activeNodeId,
        }));
      },
      setActiveNode: (id) => set({ activeNodeId: id }),
      clearError: () => set({ lastError: null }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: BRAIN_STORAGE_KEY,
      storage: brainStorage,
      partialize: (state) => ({
        nodes: state.nodes,
        activeNodeId: state.activeNodeId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);


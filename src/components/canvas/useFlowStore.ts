"use client";

import { create } from "zustand";
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect, Connection } from "reactflow";
import { applyNodeChanges, applyEdgeChanges, addEdge } from "reactflow";
import type { OnboardingPresetId } from "@/components/onboarding/OnboardingPresetPanel";

export interface FlowSnapshot {
  version: 1;
  createdAt: number;
  workspaceId?: string | null;
  nodes: Node[];
  edges: Edge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  presetId?: OnboardingPresetId | null;
}

type FlowState = {
  nodes: Node[];
  edges: Edge[];
  presetId: OnboardingPresetId | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  // eslint-disable-next-line no-unused-vars
  updateEmptyStateCopy: (presetId: OnboardingPresetId | null) => void;
  getSnapshot: () => FlowSnapshot;
  // eslint-disable-next-line no-unused-vars
  loadSnapshot: (snapshot: FlowSnapshot) => void;
};

function getEmptyStateCopy(presetId?: OnboardingPresetId | null) {
  switch (presetId) {
    case "career":
      return {
        title: "This is your Career & Learning space.",
        subtitle: "Use goals and tracks to grow your skills and job options.",
      };
    case "health":
      return {
        title: "This is your Health & Fitness space.",
        subtitle: "Structure training, habits and recovery with goals and steps.",
      };
    case "deep_work":
      return {
        title: "This is your Deep Work Lab.",
        subtitle: "Protect this space for one big project and deep work rituals.",
      };
    case "custom":
      return {
        title: "This space is completely yours.",
        subtitle: "Define your own goals, tracks and structures.",
      };
    default:
      return {
        title: "Welcome to FILON.",
        subtitle: "Create your first goal and track to start mapping your thinking.",
      };
  }
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [
    {
      id: "1",
      type: "default",
      position: { x: 0, y: -150 },
      data: { label: "Welcome to FILON" },
    },
    {
      id: "2",
      type: "goal",
      position: { x: 0, y: 0 },
      data: { label: "Create Your First Goal" },
    },
    {
      id: "3",
      type: "track",
      position: { x: 0, y: 150 },
      data: { label: "Add a Track" },
    },
  ],
  edges: [],
  presetId: null,

  onNodesChange: (changes) =>
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    }),

  onEdgesChange: (changes) =>
    set({
      edges: applyEdgeChanges(changes, get().edges),
    }),

  onConnect: (connection: Connection) =>
    set({
      edges: addEdge(connection, get().edges),
    }),

  updateEmptyStateCopy: (presetId: OnboardingPresetId | null) => {
    const copy = getEmptyStateCopy(presetId);
    const currentNodes = get().nodes;
    const updatedNodes = currentNodes.map((node) => {
      if (node.id === "1") {
        return {
          ...node,
          data: { label: copy.title },
        };
      }
      return node;
    });
    set({ nodes: updatedNodes, presetId });
  },

  getSnapshot: (): FlowSnapshot => {
    const state = get();
    return {
      version: 1,
      createdAt: Date.now(),
      workspaceId: null,
      nodes: state.nodes,
      edges: state.edges,
      presetId: state.presetId,
      // viewport is optional and not stored in flow store
      // can be added later if needed
    };
  },

  loadSnapshot: (snapshot: FlowSnapshot) => {
    // Validate snapshot version
    if (snapshot.version !== 1) {
      console.warn(
        `[FlowStore] Unsupported snapshot version: ${snapshot.version}. Expected version 1.`
      );
      return;
    }

    // Validate required fields
    if (!Array.isArray(snapshot.nodes) || !Array.isArray(snapshot.edges)) {
      console.warn("[FlowStore] Invalid snapshot: nodes and edges must be arrays.");
      return;
    }

    // Load nodes and edges
    set({
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      presetId: snapshot.presetId ?? null,
    });

    // If presetId is provided, update empty state copy
    if (snapshot.presetId) {
      const copy = getEmptyStateCopy(snapshot.presetId);
      const updatedNodes = snapshot.nodes.map((node) => {
        if (node.id === "1") {
          return {
            ...node,
            data: { label: copy.title },
          };
        }
        return node;
      });
      set({ nodes: updatedNodes });
    }

    // Note: viewport restoration would need to be handled separately
    // via ReactFlow instance or UIStore, as it's not part of this store
  },
}));


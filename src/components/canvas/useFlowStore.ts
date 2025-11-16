"use client";

import { create } from "zustand";
import type {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Connection,
} from "reactflow";
import { applyNodeChanges, applyEdgeChanges, addEdge } from "reactflow";
import type { OnboardingPresetId } from "@/components/onboarding/OnboardingPresetPanel";

export interface FlowSnapshot {
  version: 1;
  createdAt: number;
  workspaceId?: string | null;
  nodes: Node[];
  edges: Edge[];
  presetId?: OnboardingPresetId | null;
}

type FlowState = {
  nodes: Node[];
  edges: Edge[];
  presetId: OnboardingPresetId | null;
  hasLoadedSnapshot: boolean;
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeDragStop: (nodeId: string, position: Node["position"]) => void;
  updateEmptyStateCopy: (presetId: OnboardingPresetId | null) => void;
  getSnapshot: () => FlowSnapshot;
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
  hasLoadedSnapshot: false,

  setNodes: (updater) =>
    set((state) => ({
      nodes: updater(state.nodes),
    })),

  setEdges: (updater) =>
    set((state) => ({
      edges: updater(state.edges),
    })),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),

  onConnect: (connection: Connection) =>
    set((state) => ({
      edges: addEdge(connection, state.edges),
    })),

  onNodeDragStop: (nodeId, position) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, position: { ...position } } : node
      ),
    })),

  updateEmptyStateCopy: (presetId: OnboardingPresetId | null) => {
    const state = get();
    if (state.hasLoadedSnapshot) {
      return;
    }

    const copy = getEmptyStateCopy(presetId);
    set((current) => {
      const updatedNodes = current.nodes.map((node) => {
        if (node.id === "1") {
          return {
            ...node,
            data: { label: copy.title },
          };
        }
        return node;
      });
      return { nodes: updatedNodes, presetId: presetId ?? null };
    });
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
    };
  },

  loadSnapshot: (snapshot: FlowSnapshot) => {
    if (snapshot.version !== 1) {
      if (
        typeof window !== "undefined" &&
        (window as any).__FILON_SESSION_DEBUG__ === true
      ) {
        // eslint-disable-next-line no-console
        console.warn(
          `[FlowStore] Unsupported snapshot version: ${snapshot.version}. Expected version 1.`
        );
      }
      return;
    }

    if (!Array.isArray(snapshot.nodes) || !Array.isArray(snapshot.edges)) {
      if (
        typeof window !== "undefined" &&
        (window as any).__FILON_SESSION_DEBUG__ === true
      ) {
        // eslint-disable-next-line no-console
        console.warn("[FlowStore] Invalid snapshot: nodes and edges must be arrays.");
      }
      return;
    }

    set({
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      presetId: snapshot.presetId ?? null,
      hasLoadedSnapshot: true,
    });
  },
}));


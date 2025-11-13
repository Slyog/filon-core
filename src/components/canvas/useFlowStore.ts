"use client";

import { create } from "zustand";
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect, Connection } from "reactflow";
import { applyNodeChanges, applyEdgeChanges, addEdge } from "reactflow";

type FlowState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [
    {
      id: "1",
      type: "default",
      position: { x: 0, y: 0 },
      data: { label: "Canvas Ready" },
    },
  ],
  edges: [],

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
}));


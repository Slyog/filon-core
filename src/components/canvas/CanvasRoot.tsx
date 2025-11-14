"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
} from "reactflow";
import { nodeTypes } from "./NodeRenderer";
import { edgeTypes } from "./EdgeRenderer";
import "reactflow/dist/style.css";

const initialNodes: Node[] = [
  {
    id: "1",
    type: "default",
    position: { x: 250, y: 100 },
    data: { label: "Welcome to FILON" },
  },
  {
    id: "2",
    type: "goal",
    position: { x: 250, y: 250 },
    data: { label: "Create Your First Goal" },
  },
  {
    id: "3",
    type: "track",
    position: { x: 250, y: 400 },
    data: { label: "Add a Track" },
  },
];

const initialEdges: Edge[] = [];

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  return (
    <div className="w-full h-full bg-filon-bg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        proOptions={{ hideAttribution: true }}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        className="bg-filon-bg"
        style={{ background: "var(--filon-bg)" }}
      >
        <Background
          gap={16}
          size={1}
          color="var(--filon-border)"
          style={{ backgroundColor: "var(--filon-bg)" }}
        />
        <Controls
          style={{
            backgroundColor: "var(--filon-surface)",
            border: "1px solid var(--filon-border)",
          }}
          className="[&_button]:bg-filon-surface [&_button]:border-filon-border [&_button]:text-filon-text [&_button:hover]:bg-filon-bg [&_button:hover]:border-filon-accent"
        />
        <MiniMap
          nodeColor="var(--filon-accent)"
          maskColor="rgba(0, 0, 0, 0.8)"
          style={{
            backgroundColor: "var(--filon-surface)",
            border: "1px solid var(--filon-border)",
          }}
          className="!bg-filon-surface !border-filon-border"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

export function CanvasRoot() {
  return (
    <div className="w-full h-full relative overflow-hidden">
      <ReactFlowProvider>
        <FlowCanvas />
      </ReactFlowProvider>
    </div>
  );
}

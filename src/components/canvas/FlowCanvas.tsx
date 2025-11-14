"use client";

import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";

import { edgeTypes } from "./EdgeRenderer";
import { flowConfig } from "./flowConfig";
import { nodeTypes } from "./NodeRenderer";
import { useFlowStore } from "./useFlowStore";

type FlowCanvasProps = {
  onInit?: (instance: ReactFlowInstance) => void;
};

export function FlowCanvas({ onInit }: FlowCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useFlowStore();

  return (
    <ReactFlow
      data-id="flow-wrapper"
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onInit={onInit}
      defaultEdgeOptions={flowConfig.defaultEdgeOptions}
      snapToGrid
      snapGrid={flowConfig.snapGrid}
      proOptions={{ hideAttribution: true }}
      panOnScroll
      zoomOnScroll
      zoomOnPinch
      className="w-full h-full min-h-0 min-w-0 bg-transparent"
    >
      <Background gap={16} size={1} color="var(--filon-border)" />
      <Controls
        style={{
          backgroundColor: "var(--filon-surface)",
          border: "1px solid var(--filon-border)",
        }}
        className="[&_button]:bg-filon-surface [&_button]:border-filon-border"
      />
      <MiniMap
        nodeColor="var(--filon-accent)"
        maskColor="rgba(0,0,0,0.8)"
        className="!bg-filon-surface !border-filon-border"
      />
    </ReactFlow>
  );
}



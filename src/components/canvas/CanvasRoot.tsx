"use client";

import { ReactFlow, Background, Controls, ReactFlowProvider } from "reactflow";
import { useFlowStore } from "./useFlowStore";
import { nodeTypes } from "./NodeRenderer";
import { edgeTypes } from "./EdgeRenderer";

export function CanvasRoot() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useFlowStore();

  return (
    <ReactFlowProvider>
      <div className="w-full h-full">
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
        >
          <Background gap={12} color="#e5e5e5" />
          <Controls />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}

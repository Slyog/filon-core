"use client";

import { useEffect, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type ReactFlowInstance,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";

import { edgeTypes } from "./EdgeRenderer";
import { flowConfig } from "./flowConfig";
import { nodeTypes } from "./NodeRenderer";
import { useFlowStore } from "./useFlowStore";
import type { OnboardingPresetId } from "@/components/onboarding/OnboardingPresetPanel";

type FlowCanvasProps = {
  // eslint-disable-next-line no-unused-vars
  onInit?: (instance: ReactFlowInstance) => void;
  presetId?: OnboardingPresetId | null;
  onCreateGoalClick?: () => void;
  onAddTrackClick?: () => void;
};

export function FlowCanvas({
  onInit,
  presetId,
  onCreateGoalClick,
  onAddTrackClick,
}: FlowCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, updateEmptyStateCopy } =
    useFlowStore();

  useEffect(() => {
    if (presetId !== undefined) {
      updateEmptyStateCopy(presetId);
    }
  }, [presetId, updateEmptyStateCopy]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id === "2" && onCreateGoalClick) {
        // "Create Your First Goal" node
        onCreateGoalClick();
      } else if (node.id === "3" && onAddTrackClick) {
        // "Add a Track" node
        onAddTrackClick();
      }
    },
    [onCreateGoalClick, onAddTrackClick]
  );

  const handleInit = (instance: ReactFlowInstance) => {
    // Center the nodes in the viewport
    setTimeout(() => {
      instance.fitView({ padding: 0.1, duration: 0 });
      // Ensure zoom is not too small - adjust if needed
      const { zoom } = instance.getViewport();
      if (zoom < 0.8) {
        instance.zoomTo(0.8, { duration: 0 });
      }
    }, 0);
    onInit?.(instance);
  };

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
      onNodeClick={handleNodeClick}
      onInit={handleInit}
      defaultEdgeOptions={flowConfig.defaultEdgeOptions}
      snapToGrid
      snapGrid={flowConfig.snapGrid}
      proOptions={{ hideAttribution: true }}
      panOnScroll
      zoomOnScroll
      zoomOnPinch
      minZoom={0.5}
      maxZoom={1.5}
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



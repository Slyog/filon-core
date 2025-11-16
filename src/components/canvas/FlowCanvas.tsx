"use client";

import { useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type ReactFlowInstance,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";

import { nodeTypes } from "./NodeRenderer";
import { edgeTypes } from "./EdgeRenderer";
import { flowConfig } from "./flowConfig";
import { useFlowStore } from "./useFlowStore";
import type { OnboardingPresetId } from "@/components/onboarding/OnboardingPresetPanel";

type FlowCanvasProps = {
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
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const onConnect = useFlowStore((state) => state.onConnect);
  const updateEmptyStateCopy = useFlowStore((state) => state.updateEmptyStateCopy);

  useEffect(() => {
    if (presetId !== undefined) {
      updateEmptyStateCopy(presetId);
    }
  }, [presetId, updateEmptyStateCopy]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.id === "2" && onCreateGoalClick) {
        onCreateGoalClick();
      } else if (node.id === "3" && onAddTrackClick) {
        onAddTrackClick();
      }
    },
    [onCreateGoalClick, onAddTrackClick]
  );

  return (
    <ReactFlow
      data-id="flow-wrapper"
      data-testid="flow-canvas"
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={handleNodeClick}
      onInit={onInit}
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


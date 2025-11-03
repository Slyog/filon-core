"use client";
import type { Node, Edge } from "reactflow";

export default function GraphPreview({
  nodes,
  edges,
}: {
  nodes: Node[];
  edges: Edge[];
}) {
  // Placeholder preview - MiniMap requires ReactFlowProvider context
  // TODO: Replace with actual canvas thumbnail rendering when graph data is available
  const nodeCount = nodes.length;
  const edgeCount = edges.length;

  return (
    <div className="relative w-full h-32 rounded-md overflow-hidden border border-[rgba(47,243,255,0.15)] bg-[rgba(10,15,18,0.8)] flex items-center justify-center">
      <div className="text-center opacity-60">
        <div className="text-xs text-[var(--accent)]">
          {nodeCount > 0 ? `${nodeCount} nodes` : "Empty graph"}
        </div>
        {edgeCount > 0 && (
          <div className="text-[10px] opacity-70">{edgeCount} edges</div>
        )}
      </div>
    </div>
  );
}

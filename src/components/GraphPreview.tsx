"use client";
import { MiniMap } from "reactflow";
import type { Node, Edge } from "reactflow";

export default function GraphPreview({
  nodes,
  edges,
}: {
  nodes: Node[];
  edges: Edge[];
}) {
  return (
    <div className="relative w-full h-32 rounded-md overflow-hidden border border-[rgba(47,243,255,0.15)] bg-[rgba(10,15,18,0.8)]">
      <MiniMap
        nodeColor={() => "#2ff3ff"}
        nodeStrokeWidth={1}
        maskColor="rgba(10,15,18,0.6)"
        pannable={false}
        zoomable={false}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  type NodeProps,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";

/* ============================================================
   FILON GraphCanvas v5 — Stable Dark Mode Implementation
   - Visible glowing node
   - Correct z-index layering for controls and minimap
   - Restores FILON background + glow
============================================================ */

const CanvasNode = ({ data }: NodeProps<{ label: string }>) => (
  <div
    style={{
      background: "linear-gradient(145deg, #00D4FF 0%, #0A0F12 100%)",
      border: "1.5px solid rgba(47,243,255,0.6)",
      boxShadow: "0 0 30px rgba(47,243,255,0.45)",
      borderRadius: 14,
      color: "#FFFFFF",
      fontWeight: 600,
      textShadow: "0 0 8px #2FF3FF",
      padding: "14px 22px",
      userSelect: "none",
    }}
  >
    {data?.label ?? "🌐 FILON Visible Node"}
  </div>
);

const nodeTypes = {
  default: CanvasNode,
};

export default function GraphCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const initialized = useRef(false);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const nodeTypesMemo = useMemo(() => nodeTypes, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    setNodes([
      {
        id: "1",
        type: "default",
        position: { x: 350, y: 250 },
        data: { label: "🌐 FILON Visible Node" },
      },
    ]);
  }, [setNodes]);

  useEffect(() => {
    if (!reactFlowInstance.current || nodes.length === 0) return;

    const timeout = window.setTimeout(() => {
      reactFlowInstance.current?.fitView({ padding: 0.2, duration: 400 });
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [nodes]);

  return (
    <div className="relative w-full h-full bg-[#0A0F12] overflow-hidden">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypesMemo}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
          onInit={(instance) => {
            reactFlowInstance.current = instance;
            instance.fitView({ padding: 0.2, duration: 400 });
          }}
          fitView
          fitViewOptions={{ padding: 0.2, duration: 400 }}
          minZoom={0.4}
          maxZoom={2}
          zoomOnScroll
          panOnScroll
          panOnDrag
          style={{
            background:
              "radial-gradient(circle at 50% 50%, #0A0F12 0%, #050708 100%)",
          }}
        >
          <Background
            id="filon-bg"
            color="rgba(47,243,255,0.05)"
            gap={32}
            size={1}
            variant={BackgroundVariant.Dots}
          />
          <MiniMap
            style={{ zIndex: 20 }}
            nodeColor={() => "#2FF3FF"}
            maskColor="rgba(10,15,18,0.7)"
            zoomable
            pannable
          />
          <Controls
            style={{ zIndex: 21, opacity: 0.9 }}
            position="bottom-left"
            showInteractive={true}
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

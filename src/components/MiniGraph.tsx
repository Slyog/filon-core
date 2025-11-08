"use client";

import React, { useMemo, useCallback, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ReactFlowProvider,
  ReactFlow,
  Background,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { useActiveNode } from "@/context/ActiveNodeContext";

interface MiniGraphProps {
  nodes: Node[];
  edges: Edge[];
  onNodeHover?: (nodeId: string | null) => void;
  onNodeClick?: (nodeId: string) => void;
}

export default function MiniGraph({
  nodes,
  edges,
  onNodeHover,
  onNodeClick,
}: MiniGraphProps) {
  const { activeNodeId } = useActiveNode();
  const reduced = useReducedMotion();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Get last 5 nodes (most recently created/updated)
  const last5Nodes = useMemo(() => {
    const sorted = [...nodes]
      .sort((a, b) => {
        const aTime =
          new Date(a.data?.updatedAt || a.data?.createdAt || 0).getTime() ||
          0;
        const bTime =
          new Date(b.data?.updatedAt || b.data?.createdAt || 0).getTime() ||
          0;
        return bTime - aTime;
      })
      .slice(0, 5);

    // Normalize positions for mini view
    if (sorted.length === 0) return { nodes: [], edges: [] };

    const minX = Math.min(...sorted.map((n) => n.position.x));
    const minY = Math.min(...sorted.map((n) => n.position.y));
    const maxX = Math.max(...sorted.map((n) => n.position.x + (n.width || 150)));
    const maxY = Math.max(
      ...sorted.map((n) => n.position.y + (n.height || 40))
    );

    const width = maxX - minX || 400;
    const height = maxY - minY || 300;

    // Scale and center nodes
    const scale = Math.min(300 / width, 200 / height, 1);
    const offsetX = (300 - width * scale) / 2;
    const offsetY = (200 - height * scale) / 2;

    const normalizedNodes = sorted.map((node) => ({
      ...node,
      position: {
        x: (node.position.x - minX) * scale + offsetX,
        y: (node.position.y - minY) * scale + offsetY,
      },
      style: {
        ...node.style,
        width: (node.width || 150) * scale,
        height: (node.height || 40) * scale,
      },
    }));

    // Get edges between these nodes
    const nodeIds = new Set(sorted.map((n) => n.id));
    const relevantEdges = edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );

    return { nodes: normalizedNodes, edges: relevantEdges };
  }, [nodes, edges]);

  const handleNodeMouseEnter = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setHoveredNodeId(node.id);
      onNodeHover?.(node.id);
    },
    [onNodeHover]
  );

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
    onNodeHover?.(null);
  }, [onNodeHover]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick]
  );

  // Mobile: collapse to single glowing circle
  const [isMobile, setIsMobile] = useState(false);
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <motion.div
        className="flex items-center justify-center p-4"
        initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 120,
          damping: 22,
        }}
      >
        <div
          className="w-12 h-12 rounded-full bg-cyan-500/20 border-2 border-cyan-400/50 flex items-center justify-center text-cyan-400 text-xs font-bold glow-interactive"
          role="button"
          aria-label={`${last5Nodes.nodes.length} Nodes im Graph`}
          style={{
            boxShadow: "0 0 20px rgba(6, 182, 212, 0.4)",
          }}
        >
          {last5Nodes.nodes.length}
        </div>
      </motion.div>
    );
  }

  if (last5Nodes.nodes.length === 0) {
    return (
      <motion.div
        className="h-[200px] flex items-center justify-center text-text-muted text-xs"
        initial={reduced ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
      >
        Keine Nodes
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative w-full h-[200px] bg-[#0A0F12] rounded-lg border border-neutral-800 overflow-hidden"
      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 120,
        damping: 22,
      }}
      role="region"
      aria-label="Mini-Graph Vorschau"
    >
      <ReactFlowProvider>
        <ReactFlow
          nodes={last5Nodes.nodes.map((node) => ({
            ...node,
            style: {
              ...node.style,
              border:
                node.id === activeNodeId || node.id === hoveredNodeId
                  ? "2px solid rgba(6, 182, 212, 0.8)"
                  : "1px solid rgba(6, 182, 212, 0.3)",
              boxShadow:
                node.id === activeNodeId || node.id === hoveredNodeId
                  ? "0 0 12px rgba(6, 182, 212, 0.6)"
                  : undefined,
              transition: "all 0.2s ease",
            },
          }))}
          edges={last5Nodes.edges}
          onNodeMouseEnter={handleNodeMouseEnter}
          onNodeMouseLeave={handleNodeMouseLeave}
          onNodeClick={handleNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          preventScrolling={false}
          className="minigraph"
        >
          <Background color="#1a1a1a" gap={8} size={1} />
        </ReactFlow>
      </ReactFlowProvider>
    </motion.div>
  );
}


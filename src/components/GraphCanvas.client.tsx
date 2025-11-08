"use client";

import { useEffect, useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Connection,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion } from "framer-motion";

export default function GraphCanvas({ sessionId }: { sessionId?: string }) {
  const pathname = usePathname();
  const match = pathname?.match(/^\/f\/([^/]+)/);
  const derivedSessionId = sessionId ?? (match ? match[1] : undefined);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Load graph from localStorage
  useEffect(() => {
    if (!derivedSessionId || typeof window === "undefined") return;

    const saved = localStorage.getItem(`graph:${derivedSessionId}`);
    if (saved) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(saved);
        setNodes(savedNodes || []);
        setEdges(savedEdges || []);
      } catch (err) {
        console.warn("Graph restore failed:", err);
      }
    }
  }, [derivedSessionId, setNodes, setEdges]);

  // Save graph to localStorage
  useEffect(() => {
    if (!derivedSessionId || typeof window === "undefined") return;
    if (nodes.length === 0 && edges.length === 0) return;

    try {
      const state = JSON.stringify({ nodes, edges });
      localStorage.setItem(`graph:${derivedSessionId}`, state);
    } catch (err) {
      console.warn("Graph save failed:", err);
    }
  }, [nodes, edges, derivedSessionId]);

  // Node click handler - toggle selection
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === node.id ? !n.selected : false,
          data: {
            ...n.data,
            selected: n.id === node.id ? !n.data?.selected : false,
          },
        }))
      );
    },
    [setNodes]
  );

  // Node hover handlers
  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    setHoveredNodeId(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  // Edge creation
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  // Style nodes with glow effect
  const styledNodes = nodes.map((n) => {
    const isSelected = n.selected || n.data?.selected;
    const isHovered = hoveredNodeId === n.id;

    return {
      ...n,
      style: {
        borderRadius: 12,
        padding: 8,
        background: isSelected
          ? "radial-gradient(circle, rgba(47,243,255,0.25) 0%, rgba(0,0,0,0.9) 100%)"
          : "rgba(0,0,0,0.7)",
        boxShadow: isSelected
          ? "0 0 16px 4px rgba(47,243,255,0.5)"
          : isHovered
          ? "0 0 12px 2px rgba(47,243,255,0.3)"
          : "0 0 8px rgba(47,243,255,0.15)",
        border: "1px solid rgba(47,243,255,0.25)",
        color: "#E0FFFF",
        transition: "all 0.2s ease",
      },
    };
  });

  if (!derivedSessionId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("GraphCanvas skipped: no active session for path", pathname);
    }
    return null;
  }

  return (
    <motion.div
      layout
      className="absolute inset-0 flex items-center justify-center bg-[#0A0F12] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <ReactFlow
        nodes={styledNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        className="transition-all duration-300"
      >
        <MiniMap
          nodeColor={(n: Node) =>
            n.selected || n.data?.selected ? "#2FF3FF" : "#1B2730"
          }
          maskColor="rgba(15,30,40,0.7)"
        />
        <Controls showInteractive={false} position="bottom-right" />
        <Background color="rgba(47,243,255,0.05)" gap={32} size={1} />
      </ReactFlow>
    </motion.div>
  );
}

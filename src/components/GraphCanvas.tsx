"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import localforage from "localforage";
import {
  ReactFlowProvider,
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type NodeMouseHandler,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import { useActiveNode } from "@/context/ActiveNodeContext";
import ThoughtPanel from "@/components/ThoughtPanel"; // ✅ Panel hinzugefügt

export default function GraphCanvas() {
  const { setActiveNodeId } = useActiveNode();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badgeRootRef = useRef<HTMLElement | null>(null);

  // ---------- Globaler Mount (UI-Layer) ----------
  useEffect(() => {
    const mount = document.createElement("div");
    mount.id = "noion-global-ui";
    Object.assign(mount.style, {
      position: "fixed",
      inset: "0px",
      pointerEvents: "none",
      zIndex: "2147483647",
    });
    document.body.appendChild(mount);
    badgeRootRef.current = mount;

    return () => {
      document.body.removeChild(mount);
    };
  }, []);

  // ---------- Badge Trigger ----------
  const showSavedBadge = useCallback(() => {
    setIsSaved(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setIsSaved(false), 1500);
  }, []);

  // ---------- Graph speichern ----------
  const saveGraph = useCallback(
    async (newNodes: Node[], newEdges: Edge[]) => {
      await Promise.all([
        localforage.setItem("noion-nodes", newNodes),
        localforage.setItem("noion-edges", newEdges),
      ]);
      showSavedBadge();
    },
    [showSavedBadge]
  );

  // ---------- Graph laden ----------
  useEffect(() => {
    (async () => {
      const n = (await localforage.getItem<Node[]>("noion-nodes")) || [];
      const e = (await localforage.getItem<Edge[]>("noion-edges")) || [];
      setNodes(n);
      setEdges(e);
    })();
  }, []);

  // ---------- Node & Edge Handler ----------
  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);
        saveGraph(updated, edges);
        return updated;
      }),
    [edges, saveGraph]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => {
        const updated = applyEdgeChanges(changes, eds);
        saveGraph(nodes, updated);
        return updated;
      }),
    [nodes, saveGraph]
  );

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => {
        const newEdges = addEdge(connection, eds);
        saveGraph(nodes, newEdges);
        return newEdges;
      }),
    [nodes, saveGraph]
  );

  const onNodeClick: NodeMouseHandler = (_, node) => {
    setActiveNodeId(node.id);
  };

  // ---------- Badge direkt in global-root rendern ----------
  useEffect(() => {
    if (!badgeRootRef.current) return;
    const badge = document.createElement("div");
    badge.textContent = "💾 Gespeichert!";
    Object.assign(badge.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      background: "#059669",
      color: "white",
      padding: "8px 14px",
      borderRadius: "9999px",
      fontSize: "14px",
      fontWeight: "600",
      boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
      opacity: "0",
      transform: "translateY(8px)",
      transition: "all 0.3s ease",
      pointerEvents: "none",
      zIndex: "2147483647",
    });
    badgeRootRef.current.appendChild(badge);

    if (isSaved) {
      badge.style.opacity = "1";
      badge.style.transform = "translateY(0)";
      setTimeout(() => {
        badge.style.opacity = "0";
        badge.style.transform = "translateY(8px)";
      }, 1500);
    }

    return () => badge.remove();
  }, [isSaved]);

  // ---------- Render ----------
  return (
    <div className="relative w-full h-full overflow-hidden">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background />
          <MiniMap />
          <Controls />
        </ReactFlow>

        {/* ✅ ThoughtPanel rechts */}
        <ThoughtPanel />
      </ReactFlowProvider>

      {/* Debug-Button */}
      <button
        onClick={showSavedBadge}
        style={{
          position: "fixed",
          bottom: "60px",
          left: "24px",
          background: "#2563eb",
          color: "white",
          padding: "8px 14px",
          borderRadius: "8px",
          zIndex: 2147483647,
        }}
      >
        🔍 Test-Badge
      </button>
    </div>
  );
}

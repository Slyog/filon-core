"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  createContext,
  type ReactNode,
} from "react";
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
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeMouseHandler,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import { useActiveNode } from "@/context/ActiveNodeContext";
import ThoughtPanel from "@/components/ThoughtPanel";

export const GraphContext = createContext<{
  updateNodeNote: (id: string, note: string) => void;
} | null>(null);

export default function GraphCanvas() {
  const { setActiveNodeId } = useActiveNode();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nodeCount, setNodeCount] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 📥 Graph laden
  useEffect(() => {
    (async () => {
      const saved = await localforage.getItem<{ nodes: Node[]; edges: Edge[] }>(
        "noion-graph"
      );
      if (saved) {
        setNodes(saved.nodes);
        setEdges(saved.edges);
        setNodeCount(saved.nodes.length + 1);
      } else {
        const defaultNodes: Node[] = [
          {
            id: "1",
            position: { x: 100, y: 100 },
            data: { label: "💡 Idee 1", note: "" },
            style: {
              background: "#1e293b",
              color: "white",
              padding: 10,
              borderRadius: 8,
              cursor: "pointer",
            },
          },
          {
            id: "2",
            position: { x: 300, y: 200 },
            data: { label: "💭 Idee 2", note: "" },
            style: {
              background: "#334155",
              color: "white",
              padding: 10,
              borderRadius: 8,
              cursor: "pointer",
            },
          },
        ];
        setNodes(defaultNodes);
        setEdges([{ id: "e1-2", source: "1", target: "2" }]);
        setNodeCount(3);
      }
    })();
  }, []);

  // 💾 Autosave
  const saveGraph = useCallback((n: Node[], e: Edge[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      void localforage.setItem("noion-graph", { nodes: n, edges: e });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 1200);
    }, 300);
  }, []);

  // 🔄 Node & Edge Handlers
  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);
        saveGraph(updated, edges);
        return updated;
      });
    },
    [edges, saveGraph]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => {
        const updated = applyEdgeChanges(changes, eds);
        saveGraph(nodes, updated);
        return updated;
      });
    },
    [nodes, saveGraph]
  );

  const onConnect: OnConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => {
        const updated = addEdge(params, eds);
        saveGraph(nodes, updated);
        return updated;
      }),
    [nodes, saveGraph]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => setActiveNodeId(node.id),
    [setActiveNodeId]
  );

  // 🧠 Node-Notiz aktualisieren
  const updateNodeNote = useCallback(
    (nodeId: string, note: string) => {
      setNodes((nds) => {
        const updated = nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, note } } : n
        );
        saveGraph(updated, edges);
        return updated;
      });
    },
    [edges, saveGraph]
  );

  // ➕ Node hinzufügen
  const addNode = useCallback(() => {
    const id = `${nodeCount}`;
    const newNode: Node = {
      id,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 200 + 100 },
      data: { label: `🧠 Gedanke ${id}`, note: "" },
      style: {
        background: "#475569",
        color: "white",
        padding: 10,
        borderRadius: 8,
        cursor: "pointer",
      },
    };
    setNodes((nds) => {
      const updated = [...nds, newNode];
      saveGraph(updated, edges);
      return updated;
    });
    setNodeCount((n) => n + 1);
  }, [edges, nodeCount, saveGraph]);

  // 🧹 Graph löschen
  const clearGraph = useCallback(async () => {
    setNodes([]);
    setEdges([]);
    setNodeCount(1);
    await localforage.removeItem("noion-graph");
    const keys = await localforage.keys();
    for (const key of keys)
      if (key.startsWith("note-")) await localforage.removeItem(key);
  }, []);

  // 🔍 Suchfunktion
  const filteredNodes = nodes.filter((node) =>
    node.data.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 💾 Globales Badge (Portal in <body>)
  useEffect(() => {
    const existing = document.getElementById("noion-badge");
    if (existing) existing.remove();

    const badge = document.createElement("div");
    badge.id = "noion-badge";
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
      opacity: isSaved ? "1" : "0",
      transform: isSaved ? "translateY(0)" : "translateY(8px)",
      transition: "all 0.3s ease",
      pointerEvents: "none",
      zIndex: "2147483647",
    });
    document.body.appendChild(badge);

    return () => badge.remove();
  }, [isSaved]);

  return (
    <GraphContext.Provider value={{ updateNodeNote }}>
      <div
        className="relative border border-zinc-700 rounded-2xl bg-[#111827] overflow-hidden"
        style={{ width: "100%", height: "80vh", minHeight: "400px" }}
      >
        {/* 🔧 Toolbar */}
        <div className="absolute top-2 left-2 z-10 flex gap-2">
          <input
            type="text"
            placeholder="🔍 Suchbegriff eingeben..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 rounded-lg bg-[#2a2a2a] text-white text-sm outline-none"
          />
          <button
            onClick={addNode}
            className="px-3 py-1 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium shadow-md"
          >
            + Node
          </button>
          <button
            onClick={clearGraph}
            className="px-3 py-1 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium shadow-md"
          >
            Clear
          </button>
        </div>

        {/* 🧠 React Flow Graph */}
        <ReactFlowProvider>
          <ReactFlow
            nodes={filteredNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background color="#334155" gap={16} />
          </ReactFlow>
        </ReactFlowProvider>

        {/* 🔹 Rechtes Notiz-Panel */}
        <ThoughtPanel />
      </div>
    </GraphContext.Provider>
  );
}

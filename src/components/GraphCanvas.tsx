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
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type NodeDragHandler,
} from "reactflow";
import "reactflow/dist/style.css";

/** Stabile (nicht neu erzeugte) Typ-Objekte */
const nodeTypes = Object.freeze({});
const edgeTypes = Object.freeze({});

/** Persistenter Speicher mit Fallback */
const STORAGE_KEY = "noion-graph-v1";
function isStoredGraph(val: unknown): val is { nodes: Node[]; edges: Edge[] } {
  if (typeof val !== "object" || val === null) return false;
  const obj = val as Record<string, unknown>;
  return Array.isArray(obj.nodes) && Array.isArray(obj.edges);
}
const storage = {
  async get(): Promise<{ nodes: Node[]; edges: Edge[] } | null> {
    try {
      const v = await localforage.getItem<unknown>(STORAGE_KEY);
      const parsed: unknown = typeof v === "string" ? JSON.parse(v) : v;
      if (isStoredGraph(parsed)) return parsed;
    } catch {
      /* ignore */
    }
    try {
      const v2 = localStorage.getItem(STORAGE_KEY);
      return v2 ? JSON.parse(v2) : null;
    } catch {
      return null;
    }
  },
  async set(data: { nodes: Node[]; edges: Edge[] }) {
    const json = JSON.stringify(data);
    try {
      await localforage.setItem(STORAGE_KEY, json);
    } catch {
      /* ignore */
    }
    try {
      localStorage.setItem(STORAGE_KEY, json);
    } catch {
      /* ignore */
    }
  },
  async clear() {
    try {
      await localforage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
};

/** Nur relevante Felder sichern (keine internen ReactFlow Props) */
function sanitizeForSave(nodes: Node[], edges: Edge[]) {
  const nodesToSave = nodes.map((n) => ({
    id: n.id,
    data: n.data,
    position: { x: n.position.x, y: n.position.y },
    style: n.style,
    type: n.type, // falls später NodeTypes eingesetzt werden
  }));
  const edgesToSave = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    type: e.type,
  }));
  return { nodes: nodesToSave, edges: edgesToSave };
}

export default function GraphCanvas() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nodeCount, setNodeCount] = useState(1);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Initial laden (akzeptiert alte Objekt- und neue String-Formate) */
  useEffect(() => {
    (async () => {
      const saved = await storage.get();
      if (saved?.nodes?.length || saved?.edges?.length) {
        setNodes(saved.nodes);
        setEdges(saved.edges);
        setNodeCount(saved.nodes.length + 1);
        return;
      }
      // Defaults
      const defaults: Node[] = [
        {
          id: "1",
          position: { x: 100, y: 100 },
          data: { label: "💡 Idee 1" },
          style: {
            background: "#1e293b",
            color: "white",
            padding: 10,
            borderRadius: 8,
          },
        },
        {
          id: "2",
          position: { x: 300, y: 200 },
          data: { label: "💭 Idee 2" },
          style: {
            background: "#334155",
            color: "white",
            padding: 10,
            borderRadius: 8,
          },
        },
      ];
      setNodes(defaults);
      setEdges([{ id: "e1-2", source: "1", target: "2" }]);
      setNodeCount(3);
    })();
  }, []);

  /** Debounced speichern – und dabei immer vorher sanitisieren */
  const queueSave = useCallback((n: Node[], e: Edge[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const payload = sanitizeForSave(n, e);
    // kleine Verzögerung, um schnelle Serien zusammenzufassen
    saveTimer.current = setTimeout(() => {
      storage.set(payload);
    }, 250);
  }, []);

  /** ReactFlow-Handler: Nodes */
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);
        queueSave(updated, edges);
        return updated;
      });
    },
    [edges, queueSave]
  );

  /** ReactFlow-Handler: Edges */
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => {
        const updated = applyEdgeChanges(changes, eds);
        queueSave(nodes, updated);
        return updated;
      });
    },
    [nodes, queueSave]
  );

  /** Verbinden */
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => {
        const updated = addEdge(params, eds);
        queueSave(nodes, updated);
        return updated;
      }),
    [nodes, queueSave]
  );

  /** Drag-Ende eines Nodes → Position speichern */
  const onNodeDragStop: NodeDragHandler = useCallback(
    (_evt, _node, nodesAfterDrag) => {
      queueSave(nodesAfterDrag, edges);
    },
    [edges, queueSave]
  );

  /** Toolbar: Node hinzufügen */
  const addNode = useCallback(() => {
    const id = `${nodeCount}`;
    const newNode: Node = {
      id,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 200 + 100 },
      data: { label: `🧠 Gedanke ${id}` },
      style: {
        background: "#475569",
        color: "white",
        padding: 10,
        borderRadius: 8,
      },
    };
    setNodes((nds) => {
      const updated = [...nds, newNode];
      queueSave(updated, edges);
      return updated;
    });
    setNodeCount((n) => n + 1);
  }, [nodeCount, edges, queueSave]);

  /** Toolbar: Clear */
  const clearNodes = useCallback(async () => {
    await storage.clear();
    setNodes([]);
    setEdges([]);
    setNodeCount(1);
  }, []);

  return (
    <div
      className="relative border border-zinc-700 rounded-2xl bg-[#111827] overflow-hidden"
      style={{ width: "100%", height: "80vh", minHeight: "400px" }}
    >
      {/* Toolbar */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button
          onClick={addNode}
          className="px-3 py-1 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium shadow-md"
        >
          + Node
        </button>
        <button
          onClick={clearNodes}
          className="px-3 py-1 rounded-lg bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-medium shadow-md"
        >
          Clear
        </button>
      </div>

      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background color="#334155" gap={16} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

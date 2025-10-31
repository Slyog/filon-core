"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  createContext,
  useMemo,
} from "react";
import localforage from "localforage";
import {
  ReactFlowProvider,
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Connection,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeMouseHandler,
  type XYPosition,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import { useActiveNode } from "@/context/ActiveNodeContext";
import ThoughtPanel from "@/components/ThoughtPanel";

export const GraphContext = createContext<{
  updateNodeNote: (id: string, note: string) => void;
} | null>(null);

type SaveState = "idle" | "saving" | "saved" | "error";

export default function GraphCanvas() {
  const { setActiveNodeId } = useActiveNode();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nodeCount, setNodeCount] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

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

  // 💾 Autosave (debounced 800ms) + Status
  const saveGraph = useCallback((n: Node[], e: Edge[]) => {
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    setSaveState("saving");

    saveDebounceRef.current = setTimeout(async () => {
      try {
        const when = Date.now();
        await localforage.setItem("noion-graph", {
          nodes: n,
          edges: e,
          meta: { lastSavedAt: when, nodeCount: n.length, edgeCount: e.length },
        });
        setLastSavedAt(when);
        setSaveState("saved");

        // nach kurzer Zeit wieder in idle übergehen
        setTimeout(
          () => setSaveState((s) => (s === "saved" ? "idle" : s)),
          1000
        );
      } catch (err) {
        console.error("Autosave failed:", err);
        setSaveState("error");
      }
    }, 800);
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

  // Selektions-Glow als Helper (keine globalen Styles anfassen)
  const withGlow = useCallback(
    (n: Node, active: boolean) => ({
      ...n,
      selected: active,
      style: {
        ...n.style,
        // sanfter, risikoarmer Glow
        boxShadow: active ? "0 0 14px rgba(47,243,255,0.9)" : undefined,
        // optional leichtes Outline als Fallback
        outline: active ? "2px solid #2FF3FF" : undefined,
        outlineOffset: active ? "2px" : undefined,
        // niemals Größe/Position ändern
      },
    }),
    []
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      setActiveNodeId(node.id);
      // Selektion auf genau diesen Node setzen
      setNodes((nds) => nds.map((n) => withGlow(n, n.id === node.id)));
    },
    [setActiveNodeId, setNodes, withGlow]
  );

  const onPaneClick = useCallback(() => {
    setNodes((nds) => nds.map((n) => withGlow(n, false)));
    setActiveNodeId(null);
  }, [setNodes, setActiveNodeId, withGlow]);

  const onNodeDragStop: NodeMouseHandler = useCallback(() => {
    // Nichts tun → Selektion/Glow bleibt erhalten
  }, []);

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

  // 🔍 Suchfunktion (memoized, um infinite loops zu vermeiden)
  const filteredNodes = useMemo(
    () =>
      nodes.filter((node) =>
        node.data.label.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [nodes, searchTerm]
  );

  // Helper: editierbare Targets erkennen, damit Hotkeys beim Tippen nicht stören
  const isEditableTarget = (e: EventTarget | null) => {
    if (!(e instanceof HTMLElement)) return false;
    const tag = e.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea") return true;
    if (e.isContentEditable) return true; // z.B. Markdown-Editor
    return false;
  };

  // 🔍 Highlight aktualisieren bei Indexwechsel (nur bei Pfeiltasten, nicht bei jedem Render)
  useEffect(() => {
    // Keine Nodes verändern, wenn kein Treffer vorhanden
    if (searchTerm === "" || filteredNodes.length === 0) return;

    const activeNodeId =
      selectedIndex >= 0 && selectedIndex < filteredNodes.length
        ? filteredNodes[selectedIndex].id
        : null;

    // Nur visuellen Zustand aktualisieren (einmal pro Indexwechsel)
    setNodes((nds) =>
      nds.map((n) => {
        const isMatch = n.data.label
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const isActive = n.id === activeNodeId;
        return {
          ...n,
          selected: isActive,
          style: {
            ...n.style,
            boxShadow: isActive
              ? "0 0 14px rgba(47,243,255,0.9)"
              : isMatch
              ? "0 0 8px rgba(47,243,255,0.4)"
              : undefined,
            outline: isActive ? "2px solid #2FF3FF" : undefined,
            outlineOffset: isActive ? "2px" : undefined,
          },
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]); // 👈 nur bei Indexwechsel ausführen, nicht bei jedem Render

  // 💬 Globales HUD-Badge (unten rechts) – zeigt Save-Status
  useEffect(() => {
    const id = "noion-badge";
    let badge = document.getElementById(id);
    if (!badge) {
      badge = document.createElement("div");
      badge.id = id;
      document.body.appendChild(badge);
    }

    const fmtTime = (ts: number) =>
      new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

    const text =
      saveState === "saving"
        ? "💾 Speichern …"
        : saveState === "saved"
        ? `✅ Gespeichert • ${lastSavedAt ? fmtTime(lastSavedAt) : ""}`
        : saveState === "error"
        ? "⚠️ Speichern fehlgeschlagen"
        : " "; // idle = leer

    Object.assign(badge.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      background:
        saveState === "error"
          ? "#991b1b"
          : saveState === "saving"
          ? "#0ea5e9"
          : "#059669",
      color: "white",
      padding: "8px 14px",
      borderRadius: "9999px",
      fontSize: "14px",
      fontWeight: "600",
      boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
      opacity: saveState === "idle" ? "0" : "1",
      transform: saveState === "idle" ? "translateY(8px)" : "translateY(0)",
      transition: "all 0.25s ease",
      pointerEvents: "none",
      zIndex: "2147483647",
      whiteSpace: "nowrap",
    });
    badge.textContent = text;

    return () => {
      // Badge behalten (persistentes HUD), kein remove
    };
  }, [saveState, lastSavedAt]);

  return (
    <GraphContext.Provider value={{ updateNodeNote }}>
      <div
        className="relative border border-zinc-700 rounded-2xl bg-[#111827] overflow-hidden"
        style={{ width: "100%", height: "80vh", minHeight: "400px" }}
      >
        {/* 🔧 Toolbar */}
        <div className="absolute top-2 left-2 z-10 flex gap-2">
          <input
            ref={searchRef}
            type="text"
            placeholder="🔍 Suchbegriff eingeben..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedIndex(-1); // reset navigation
            }}
            onKeyDown={(e) => {
              const matching = nodes.filter((n) =>
                n.data.label.toLowerCase().includes(searchTerm.toLowerCase())
              );

              // ↓ nächster Treffer
              if (e.key === "ArrowDown" && matching.length > 0) {
                e.preventDefault();
                setSelectedIndex((prev) =>
                  prev + 1 < matching.length ? prev + 1 : 0
                );
                return;
              }

              // ↑ vorheriger Treffer
              if (e.key === "ArrowUp" && matching.length > 0) {
                e.preventDefault();
                setSelectedIndex((prev) =>
                  prev - 1 >= 0 ? prev - 1 : matching.length - 1
                );
                return;
              }

              // Enter → Panel für aktuellen Node öffnen
              if (
                e.key === "Enter" &&
                matching.length > 0 &&
                selectedIndex >= 0
              ) {
                e.preventDefault();
                const current = matching[selectedIndex];
                if (current) {
                  setActiveNodeId(current.id);
                  // visuelles Feedback
                  setNodes((nds) =>
                    nds.map((n) => ({
                      ...n,
                      selected: n.id === current.id,
                      style: {
                        ...n.style,
                        boxShadow:
                          n.id === current.id
                            ? "0 0 14px rgba(47,243,255,0.9)"
                            : undefined,
                        outline:
                          n.id === current.id ? "2px solid #2FF3FF" : undefined,
                        outlineOffset: n.id === current.id ? "2px" : undefined,
                      },
                    }))
                  );
                }
                return;
              }

              // Esc → Suche leeren & Auswahl zurücksetzen
              if (e.key === "Escape") {
                e.preventDefault();
                setSearchTerm("");
                setSelectedIndex(-1);
                setNodes((nds) =>
                  nds.map((n) => ({
                    ...n,
                    selected: false,
                    style: {
                      ...n.style,
                      boxShadow: undefined,
                      outline: undefined,
                      outlineOffset: undefined,
                    },
                  }))
                );
                return;
              }
            }}
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
          <GraphFlowWithHotkeys
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodeDragStop={onNodeDragStop}
            filteredNodes={filteredNodes}
            edges={edges}
            setNodes={setNodes}
            withGlow={withGlow}
            setActiveNodeId={setActiveNodeId}
            searchRef={searchRef}
            isEditableTarget={isEditableTarget}
          />
        </ReactFlowProvider>

        {/* 🔹 Rechtes Notiz-Panel */}
        <ThoughtPanel />
      </div>
    </GraphContext.Provider>
  );
}

// 🔧 Innere Komponente korrigiert
function GraphFlowWithHotkeys({
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onPaneClick,
  onNodeDragStop,
  filteredNodes,
  edges,
  setNodes,
  withGlow,
  setActiveNodeId,
  searchRef,
  isEditableTarget,
}: {
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeClick: NodeMouseHandler;
  onPaneClick: () => void;
  onNodeDragStop: NodeMouseHandler;
  filteredNodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  withGlow: (n: Node, active: boolean) => Node;
  setActiveNodeId: (id: string | null) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  isEditableTarget: (e: EventTarget | null) => boolean;
}) {
  const rf = useReactFlow();

  const addNodeAt = useCallback(
    (pos: XYPosition) => {
      setNodes((nds) => {
        const id = `n_${Date.now()}`;
        const cleared = nds.map((n) => ({
          ...n,
          selected: false,
          style: {
            ...n.style,
            boxShadow: undefined,
            outline: undefined,
            outlineOffset: undefined,
          },
        }));
        const newNode: Node = {
          id,
          position: pos,
          data: { label: "🧠 Neuer Gedanke", note: "" },
          type: "default",
          selected: true,
          style: {
            ...(cleared[0]?.style ?? {}),
            background: "#475569",
            color: "white",
            padding: 10,
            borderRadius: 8,
            cursor: "pointer",
            boxShadow: "0 0 14px rgba(47,243,255,0.9)",
            outline: "2px solid #2FF3FF",
            outlineOffset: "2px",
          },
        };
        return [...cleared, newNode];
      });
    },
    [setNodes]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // "/" -> Suche fokussieren
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (!isEditableTarget(document.activeElement)) {
          e.preventDefault();
          searchRef.current?.focus();
        }
        return;
      }

      // "n" -> neuen Node nahe Bildschirmmitte anlegen
      if (
        (e.key === "n" || e.key === "N") &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        if (isEditableTarget(document.activeElement)) return;
        e.preventDefault();
        // Leicht oberhalb der Mitte platzieren, damit Node nicht von der Toolbar überlappt wird
        const offsetY = -80; // ≈ 5 % Bildschirmhöhe – justierbar
        const screenCenter = {
          x: Math.round(window.innerWidth / 2),
          y: Math.round(window.innerHeight / 2 + offsetY),
        };
        const flowPos = rf.screenToFlowPosition(screenCenter);
        addNodeAt(flowPos);
        return;
      }

      // "Escape" -> Selektion aufheben & Panel schließen
      if (e.key === "Escape") {
        e.preventDefault();
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            selected: false,
            style: {
              ...n.style,
              boxShadow: undefined,
              outline: undefined,
              outlineOffset: undefined,
            },
          }))
        );
        setActiveNodeId(null);
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rf, addNodeAt, setNodes, setActiveNodeId, searchRef, isEditableTarget]);

  // ✅ Kein fitView → verhindert Viewport-Resets
  return (
    <ReactFlow
      nodes={filteredNodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onNodeDragStop={onNodeDragStop}
      // ❌ fitView entfernt → keine Auto-Zentrierung mehr
    >
      <MiniMap />
      <Controls />
      <Background color="#334155" gap={16} />
    </ReactFlow>
  );
}

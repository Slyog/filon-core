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
import { getMoodPreset, type MoodKey } from "@/lib/visual/GraphMoodEngine";
import { useMindProgress } from "@/context/MindProgressContext";
import ThoughtPanel from "@/components/ThoughtPanel";
import SaveStatusBadge from "@/components/SaveStatusBadge";
import SessionBadge from "@/components/SessionBadge";
import SnapshotPanel from "@/components/SnapshotPanel";
import BranchPanel from "@/components/BranchPanel";
import TimelinePlayer from "@/components/TimelinePlayer";
import InsightsPanel from "@/components/InsightsPanel";
import ContextMenu from "@/components/ContextMenu";
import {
  saveGraphRemote,
  loadGraphSync,
  syncAndResolve,
} from "@/lib/syncAdapter";
import {
  saveSession,
  saveGraphState,
  loadGraphState,
  type GraphState,
} from "@/lib/sessionManager";
import {
  saveSnapshot,
  clearSnapshots,
  updateSummary,
  listSnapshots,
  loadSnapshot,
  // listSnapshots and loadSnapshot reserved for future Version History UI
} from "@/lib/versionManager";
import { getActiveBranch, getBranch, type Branch } from "@/lib/branchManager";
import { diffGraphs, type DiffResult } from "@/lib/diffEngine";
import { generateSnapshotSummary } from "@/lib/aiSummarizer";
import {
  addFeedbackEvent,
  cleanupOldFeedback,
} from "@/lib/feedback/FeedbackStore";
import { getMostRelevantInsight } from "@/lib/feedback/FeedbackEngine";
import { motion, AnimatePresence } from "framer-motion";

export const GraphContext = createContext<{
  updateNodeNote: (id: string, note: string) => void;
} | null>(null);

type SaveState = "idle" | "saving" | "saved" | "error" | "conflict";
type ToastType = "restore" | "save" | "recovery" | "error" | null;

export default function GraphCanvas() {
  const { activeNodeId, setActiveNodeId } = useActiveNode();
  const { currentMindState, setCurrentMindState } = useMindProgress();
  const [motionTest, setMotionTest] = useState(false);
  const [contextNode, setContextNode] = useState<Node | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [activeNode, setActiveNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nodeCount, setNodeCount] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [lastActiveId, setLastActiveId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [snapshotPanelOpen, setSnapshotPanelOpen] = useState(false);
  const [branchPanelOpen, setBranchPanelOpen] = useState(false);
  const [visualizerOpen, setVisualizerOpen] = useState(false);
  const [playbackPanelOpen, setPlaybackPanelOpen] = useState(false);
  const [insightsPanelOpen, setInsightsPanelOpen] = useState(false);
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [playbackActive, setPlaybackActive] = useState(false);
  const [originalGraphState, setOriginalGraphState] = useState<{
    nodes: Node[];
    edges: Edge[];
  } | null>(null);
  const [toast, setToast] = useState<{
    type: ToastType;
    message: string;
  } | null>(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const hasUnsavedChangesRef = useRef(false);
  const lastSnapshotRef = useRef<number>(0);
  const nodeChangeCountRef = useRef<number>(0);
  const lastInsightCheckRef = useRef<number>(0);

  // 🧪 Motion Test Toggle
  useEffect(() => {
    if (motionTest) {
      document.body.classList.add("motion-test");
    } else {
      document.body.classList.remove("motion-test");
    }
    return () => document.body.classList.remove("motion-test");
  }, [motionTest]);

  // 📥 Graph laden (CRDT-Sync mit Conflict-Resolution) + Session Recovery
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        // Clean up expired snapshots and feedback events on mount
        await clearSnapshots();
        await cleanupOldFeedback();

        // Try to restore from session manager first
        const savedGraphState = await loadGraphState();
        if (savedGraphState) {
          setNodes(savedGraphState.nodes ?? []);
          setEdges(savedGraphState.edges ?? []);
          setNodeCount((savedGraphState.nodes?.length ?? 0) + 1);
          setToast({
            type: "recovery",
            message: `📦 Vorheriger Zustand wiederhergestellt (${
              savedGraphState.nodes?.length ?? 0
            } Nodes)`,
          });
          setTimeout(() => setToast(null), 4000);
        }

        // Then sync with remote (CRDT-Sync)
        const result = await syncAndResolve("mergeProps");
        if (result?.merged) {
          setNodes(result.merged.nodes ?? []);
          setEdges(result.merged.edges ?? []);
          setNodeCount((result.merged.nodes?.length ?? 0) + 1);

          // Konflikte loggen
          if (result.conflicts.length > 0) {
            console.warn(
              `⚠️ ${result.conflicts.length} Konflikte automatisch aufgelöst`
            );
          }
        }

        // 🌿 Load active branch
        const activeBranchId = await getActiveBranch();
        if (activeBranchId) {
          const branch = await getBranch(activeBranchId);
          if (branch) {
            setActiveBranch(branch);
          }
        }
      } catch (err) {
        console.error("Failed to load graph:", err);
      } finally {
        // Reset active node states after load to prevent stale data
        setActiveNode(null);
        setActiveNodeId(null);
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🚨 Browser-Warnung bei ungespeicherten Änderungen
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue =
          "Sie haben ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // 🧠 Periodic Learning Summary Generation (every 10 minutes)
  // TODO: Re-enable when UI panel is properly styled
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     generateLearningSummary().then((summary) => {
  //       if (summary) {
  //         console.log("📊 Learning Summary:", summary);
  //       }
  //     });
  //   }, 10 * 60 * 1000); // 10 minutes
  //   return () => clearInterval(interval);
  // }, []);

  // 🎯 Keyboard Shortcut for Insights Panel (Alt+I)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "i") {
        setInsightsPanelOpen((s) => !s);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // 🎯 Escape to close Meta-Editor
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeNode) {
        setActiveNode(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeNode]);

  // 💾 Autosave (debounced 800ms) + Status + Session Persistence + Snapshot
  const saveGraph = useCallback(
    (n: Node[], e: Edge[]) => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
      setSaveState("saving");
      hasUnsavedChangesRef.current = true;

      saveDebounceRef.current = setTimeout(async () => {
        const saveStartTime = Date.now();
        try {
          const when = Date.now();
          await saveGraphRemote({ nodes: n, edges: e });

          // Also save to session manager for crash recovery
          await saveGraphState({ nodes: n, edges: e });

          // Log successful save
          await addFeedbackEvent({
            timestamp: when,
            type: "save",
            details: { nodeCount: n.length, edgeCount: e.length },
            success: true,
            duration: Date.now() - saveStartTime,
          });

          // Create version snapshot conditionally: every ~5 min or 20+ node changes
          const timeSinceLastSnapshot = when - lastSnapshotRef.current;
          const shouldSnapshot =
            timeSinceLastSnapshot > 5 * 60 * 1000 ||
            nodeChangeCountRef.current >= 20;

          if (shouldSnapshot) {
            const snapshotId = await saveSnapshot(
              { nodes: n, edges: e },
              activeBranch
                ? {
                    branchId: activeBranch.id,
                    branchName: activeBranch.name,
                  }
                : undefined
            );
            lastSnapshotRef.current = when;
            nodeChangeCountRef.current = 0;

            // Generate AI summary if snapshot was created successfully
            if (snapshotId) {
              // Log successful snapshot
              await addFeedbackEvent({
                timestamp: when,
                type: "snapshot",
                details: {
                  snapshotId,
                  nodeCount: n.length,
                  edgeCount: e.length,
                },
                success: true,
              });

              setToast({
                type: "save",
                message: "🤖 Analyzing snapshot changes...",
              });

              // Get previous snapshot for comparison
              const allSnapshots = await listSnapshots(2);
              if (allSnapshots.length > 1) {
                const previousSnapshot = allSnapshots[1]; // Second most recent
                const previousState = await loadSnapshot(previousSnapshot.id);

                if (previousState) {
                  const diff = diffGraphs(previousState, {
                    nodes: n,
                    edges: e,
                  });
                  const summary = await generateSnapshotSummary(diff);

                  if (summary) {
                    await updateSummary(snapshotId, summary);
                    setToast({
                      type: "save",
                      message: "🧠 Summary generated",
                    });
                    setTimeout(() => setToast(null), 3000);
                  }
                }
              }
            } else {
              setToast({
                type: "save",
                message: "📜 Snapshot created",
              });
              setTimeout(() => setToast(null), 3000);
            }
          } else {
            nodeChangeCountRef.current++;
          }

          setLastSavedAt(when);
          setSaveState("saved");
          hasUnsavedChangesRef.current = false;

          // Check for insights occasionally (every 30 seconds max)
          const timeSinceLastInsight = Date.now() - lastInsightCheckRef.current;
          if (timeSinceLastInsight > 30 * 1000) {
            lastInsightCheckRef.current = Date.now();
            const insight = await getMostRelevantInsight();
            if (insight) {
              setToast({
                type: "save",
                message: `🧩 ${insight}`,
              });
              setTimeout(() => setToast(null), 5000);
            }
          }

          // nach kurzer Zeit wieder in idle übergehen
          setTimeout(
            () => setSaveState((s) => (s === "saved" ? "idle" : s)),
            1000
          );
        } catch (err) {
          console.warn("Remote save failed, local only", err);

          // Log error
          await addFeedbackEvent({
            timestamp: Date.now(),
            type: "error",
            details: {
              error: "save_failed",
              nodeCount: n.length,
              edgeCount: e.length,
            },
            success: false,
          });

          await localforage.setItem("noion-graph", { nodes: n, edges: e });
          // Still save to session manager for recovery
          await saveGraphState({ nodes: n, edges: e });
          // Create snapshot even if remote save fails (same conditional logic)
          const timeSinceLastSnapshot = Date.now() - lastSnapshotRef.current;
          const shouldSnapshot =
            timeSinceLastSnapshot > 5 * 60 * 1000 ||
            nodeChangeCountRef.current >= 20;

          if (shouldSnapshot) {
            const snapshotId = await saveSnapshot(
              { nodes: n, edges: e },
              activeBranch
                ? {
                    branchId: activeBranch.id,
                    branchName: activeBranch.name,
                  }
                : undefined
            );
            lastSnapshotRef.current = Date.now();
            nodeChangeCountRef.current = 0;

            // Generate AI summary if snapshot was created successfully
            if (snapshotId) {
              // Log successful snapshot
              await addFeedbackEvent({
                timestamp: Date.now(),
                type: "snapshot",
                details: {
                  snapshotId,
                  nodeCount: n.length,
                  edgeCount: e.length,
                },
                success: true,
              });

              setToast({
                type: "save",
                message: "🤖 Analyzing snapshot changes...",
              });

              // Get previous snapshot for comparison
              const allSnapshots = await listSnapshots(2);
              if (allSnapshots.length > 1) {
                const previousSnapshot = allSnapshots[1]; // Second most recent
                const previousState = await loadSnapshot(previousSnapshot.id);

                if (previousState) {
                  const diff = diffGraphs(previousState, {
                    nodes: n,
                    edges: e,
                  });
                  const summary = await generateSnapshotSummary(diff);

                  if (summary) {
                    await updateSummary(snapshotId, summary);
                    setToast({
                      type: "save",
                      message: "🧠 Summary generated",
                    });
                    setTimeout(() => setToast(null), 3000);
                  }
                }
              }
            } else {
              setToast({
                type: "save",
                message: "📜 Snapshot created",
              });
              setTimeout(() => setToast(null), 3000);
            }
          } else {
            nodeChangeCountRef.current++;
          }

          setSaveState("error");
          hasUnsavedChangesRef.current = false;
        }
      }, 800);
    },
    [activeBranch]
  );

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

  // Visualizer Dim Helper
  const withVisualizerDim = useCallback(
    (n: Node) => {
      if (!visualizerOpen || !activeBranch) return n;

      // Check if node belongs to active branch (would need branch metadata on nodes)
      // For now, just apply dimming to all nodes when visualizer is open
      // This is a simplified version - could be enhanced with branch tracking per node
      return {
        ...n,
        style: {
          ...n.style,
          opacity: 0.7,
        },
      };
    },
    [visualizerOpen, activeBranch]
  );

  // Playback Handler
  const handlePlaybackSnapshotChange = useCallback(
    async (snapshot: GraphState | null) => {
      if (!snapshot) return;

      // Store original state before first playback change if not already stored
      if (!originalGraphState && !playbackActive) {
        setOriginalGraphState({ nodes, edges });
        setPlaybackActive(true);
        setToast({
          type: "restore",
          message: "⏳ Playback started",
        });
        setTimeout(() => setToast(null), 3000);
      }

      // Animate to snapshot state
      setNodes(snapshot.nodes ?? []);
      setEdges(snapshot.edges ?? []);
    },
    [nodes, edges, originalGraphState, playbackActive]
  );

  const handlePlaybackClose = useCallback(() => {
    setPlaybackPanelOpen(false);
    setPlaybackActive(false);

    // Restore original state if exists
    if (originalGraphState) {
      setNodes(originalGraphState.nodes);
      setEdges(originalGraphState.edges);
      setOriginalGraphState(null);

      setToast({
        type: "restore",
        message: "⏹ Playback stopped",
      });
      setTimeout(() => setToast(null), 3000);
    }
  }, [originalGraphState]);

  // Diff Highlight als Helper
  const withDiffHighlight = useCallback(
    (n: Node) => {
      if (!diffResult) return n;

      const isAdded = diffResult.addedNodes.some((node) => node.id === n.id);
      const isRemoved = diffResult.removedNodes.some(
        (node) => node.id === n.id
      );
      const isChanged = diffResult.changedNodes.some(
        (change) => change.id === n.id
      );

      if (!isAdded && !isRemoved && !isChanged) return n;

      // Determine highlight color and animation
      let borderColor: string;
      let glowColor: string;
      let shouldPulse = false;

      if (isAdded) {
        borderColor = "rgb(74, 222, 128)"; // green-400
        glowColor = "rgba(74, 222, 128, 0.5)";
      } else if (isRemoved) {
        borderColor = "rgb(239, 68, 68)"; // red-500
        glowColor = "rgba(239, 68, 68, 0.5)";
      } else if (isChanged) {
        borderColor = "rgb(251, 191, 36)"; // yellow-400
        glowColor = "rgba(251, 191, 36, 0.5)";
        shouldPulse = true;
      } else {
        return n;
      }

      return {
        ...n,
        style: {
          ...n.style,
          border: `2px solid ${borderColor}`,
          boxShadow: shouldPulse
            ? `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`
            : `0 0 20px ${glowColor}`,
          outline: `2px solid ${borderColor}`,
          outlineOffset: "2px",
        },
      };
    },
    [diffResult]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      setActiveNode(node);
      setActiveNodeId(node.id);
      setLastActiveId(node.id);
      // Inline Meta-Editor opens automatically via activeNode state
      void saveSession({
        activeId: node.id,
        panel: false, // Keep old ThoughtPanel closed
      });
      // Selektion auf genau diesen Node setzen
      setNodes((nds) => nds.map((n) => withGlow(n, n.id === node.id)));
    },
    [setActiveNodeId, setNodes, withGlow]
  );

  const onPaneClick = useCallback(() => {
    setNodes((nds) => nds.map((n) => withGlow(n, false)));
    setActiveNode(null);
    setActiveNodeId(null);
    setPanelOpen(false);
    setMenuPos(null);
    setContextNode(null);
    void saveSession({ activeId: null, panel: false });
  }, [setNodes, setActiveNodeId, withGlow]);

  const onNodeDragStop: NodeMouseHandler = useCallback(() => {
    // Nichts tun → Selektion/Glow bleibt erhalten
  }, []);

  const onNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault();
    setContextNode(node);
    setMenuPos({ x: event.clientX, y: event.clientY });
  }, []);

  const closeContextMenu = useCallback(() => {
    setMenuPos(null);
    setContextNode(null);
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
    const id = crypto.randomUUID();
    const newNode: Node = {
      id,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 200 + 100 },
      data: { label: `🧠 Gedanke ${nodeCount}`, note: "" },
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

  // 🔄 Sync-Funktionen (Prisma + localforage)
  const saveToServer = async () => {
    try {
      await saveGraphRemote({ nodes, edges });
      console.log("✅ Synced to Prisma DB");
    } catch (err) {
      console.error("❌ Sync failed:", err);
    }
  };

  const loadFromServer = async () => {
    try {
      const data = await loadGraphSync();
      setNodes(data.nodes);
      setEdges(data.edges);
      console.log("✅ Synced from server", { meta: data.meta });
    } catch (err) {
      console.error("❌ Load failed:", err);
    }
  };

  // 🔍 Suchfunktion (memoized, um infinite loops zu vermeiden)
  const filteredNodes = useMemo(
    () =>
      nodes
        .filter((node) =>
          node.data.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((node) => withDiffHighlight(node))
        .map((node) => withVisualizerDim(node)),
    [nodes, searchTerm, withDiffHighlight, withVisualizerDim]
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
      <div className="relative flex min-h-screen w-full flex-1 flex-col bg-filon-bg">
        {/* 🔧 Toolbar */}
        <div className="absolute top-sm left-sm z-10 flex gap-sm">
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
            className="px-sm py-xs rounded-lg bg-filon-surface text-filon-text text-sm outline-none transition-all duration-fast"
            aria-label="Search nodes"
          />
          <button
            onClick={addNode}
            className="px-sm py-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-md transition-all duration-fast"
            aria-label="Add new node"
          >
            + Node
          </button>
          <button
            onClick={clearGraph}
            className="px-sm py-xs rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium shadow-md transition-all duration-fast"
            aria-label="Clear graph"
          >
            Clear
          </button>
          <button
            onClick={saveToServer}
            className="px-sm py-xs rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium shadow-md transition-all duration-fast"
            aria-label="Save graph to database"
          >
            💾 Save DB
          </button>
          <button
            onClick={loadFromServer}
            className="px-sm py-xs rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium shadow-md transition-all duration-fast"
            aria-label="Load graph from database"
          >
            📥 Load DB
          </button>
          <button
            onClick={() => setSnapshotPanelOpen(!snapshotPanelOpen)}
            role="button"
            aria-label={
              snapshotPanelOpen ? "Close Snapshot Panel" : "Open Snapshot Panel"
            }
            className={`px-sm py-xs rounded-lg text-white text-sm font-medium shadow-md transition-all duration-fast ${
              snapshotPanelOpen
                ? "bg-purple-700 hover:bg-purple-600 border-2 border-purple-400"
                : "bg-purple-600 hover:bg-purple-500"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="text-base">🕒</span>
              <span>{snapshotPanelOpen ? "Close Snapshots" : "Snapshots"}</span>
            </span>
          </button>
          <button
            onClick={() => setBranchPanelOpen(!branchPanelOpen)}
            role="button"
            aria-label={
              branchPanelOpen ? "Close Branch Panel" : "Open Branch Panel"
            }
            className={`px-sm py-xs rounded-lg text-white text-sm font-medium shadow-md transition-all duration-fast ${
              branchPanelOpen
                ? "bg-green-700 hover:bg-green-600 border-2 border-green-400"
                : "bg-green-600 hover:bg-green-500"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="text-base">🌿</span>
              <span>{branchPanelOpen ? "Close Branches" : "Branches"}</span>
            </span>
          </button>
          <select
            value={currentMindState}
            onChange={(e) => setCurrentMindState(e.target.value as MoodKey)}
            className="px-sm py-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-md transition-all duration-fast"
            aria-label="Select mood state"
          >
            <option value="focus">🎯 Focus</option>
            <option value="flow">💫 Flow</option>
            <option value="insight">💡 Insight</option>
            <option value="synthesis">🔮 Synthesis</option>
            <option value="resonance">✨ Resonance</option>
          </select>
          <button
            onClick={() => setMotionTest(!motionTest)}
            className={`px-sm py-xs rounded-lg text-white text-sm font-medium shadow-md transition-all duration-fast ${
              motionTest
                ? "bg-orange-600 hover:bg-orange-700 border-2 border-orange-400"
                : "bg-slate-600 hover:bg-slate-700"
            }`}
            aria-label="Toggle motion test mode"
          >
            🧪 Motion Test
          </button>
          <button
            onClick={() => {
              const text = JSON.stringify({ nodes, edges }, null, 2);
              navigator.clipboard.writeText(text);
              setToast({
                type: "save",
                message: "📋 Graph JSON copied to clipboard!",
              });
              setTimeout(() => setToast(null), 2000);
            }}
            className="px-sm py-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-md transition-all duration-fast"
            aria-label="Copy current graph JSON"
          >
            📋 Copy Graph
          </button>
          <button
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                const parsed = JSON.parse(text);
                if (!parsed.nodes) {
                  setToast({
                    type: "error",
                    message: "❌ Invalid graph format",
                  });
                  setTimeout(() => setToast(null), 2000);
                  return;
                }
                // Import via API
                const response = await fetch("/api/graph/import", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(parsed),
                });
                if (response.ok) {
                  // Reload graph
                  loadFromServer();
                  setToast({
                    type: "save",
                    message: "✅ Graph imported successfully!",
                  });
                  setTimeout(() => setToast(null), 2000);
                } else {
                  setToast({
                    type: "error",
                    message: "❌ Import failed",
                  });
                  setTimeout(() => setToast(null), 2000);
                }
              } catch (err) {
                console.error("Import error:", err);
                setToast({
                  type: "error",
                  message: "❌ Failed to read clipboard",
                });
                setTimeout(() => setToast(null), 2000);
              }
            }}
            className="px-sm py-xs rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium shadow-md transition-all duration-fast"
            aria-label="Import graph from clipboard"
          >
            📥 Import Graph
          </button>
          <button
            onClick={async () => {
              if (!activeNodeId) {
                setToast({
                  type: "error",
                  message: "⚠️ Please select a node first",
                });
                setTimeout(() => setToast(null), 2000);
                return;
              }
              try {
                const response = await fetch("/api/graph/duplicate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ nodeId: activeNodeId }),
                });
                const result = await response.json();
                if (result.ok) {
                  // Reload from server
                  loadFromServer();
                  setToast({
                    type: "save",
                    message: `✅ Duplicated: ${result.duplicate.label}`,
                  });
                  setTimeout(() => setToast(null), 2000);
                } else {
                  setToast({
                    type: "error",
                    message: "❌ Duplication failed",
                  });
                  setTimeout(() => setToast(null), 2000);
                }
              } catch (err) {
                console.error("Duplicate error:", err);
                setToast({
                  type: "error",
                  message: "❌ Duplication failed",
                });
                setTimeout(() => setToast(null), 2000);
              }
            }}
            className="px-sm py-xs rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium shadow-md transition-all duration-fast"
            aria-label="Duplicate selected node"
          >
            🔄 Duplicate Node
          </button>
        </div>

        {/* 💾 Status Badge */}
        <div className="absolute top-3 right-4 z-50">
          <SaveStatusBadge state={saveState} />
        </div>

        {/* 🔵 Session Badge */}
        <div className="absolute top-2 right-2 z-50">
          <SessionBadge
            status={
              saveState === "saving"
                ? "saving"
                : saveState === "saved"
                ? "active"
                : "idle"
            }
          />
        </div>

        {/* 🌿 Branch Badge */}
        {activeBranch && (
          <div className="absolute top-2 left-2 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="px-3 py-1.5 rounded-full bg-green-900/80 backdrop-blur-sm border border-green-400/50"
              style={{ boxShadow: "0 0 12px rgba(74, 222, 128, 0.3)" }}
            >
              <span className="text-xs font-semibold text-green-300 flex items-center gap-1.5">
                <span>🌿</span>
                <span className="truncate max-w-[120px]">
                  {activeBranch.name}
                </span>
              </span>
            </motion.div>
          </div>
        )}

        {/* 📜 Snapshot Panel */}
        <AnimatePresence>
          {snapshotPanelOpen && (
            <SnapshotPanel
              currentGraphState={{ nodes, edges }}
              onRestore={(restoredNodes, restoredEdges) => {
                setNodes(restoredNodes);
                setEdges(restoredEdges);
                setNodeCount(restoredNodes.length + 1);
                setToast({
                  type: "restore",
                  message: "✅ Snapshot restored",
                });
                setTimeout(() => setToast(null), 3000);
                // Optionally close panel after restore
                setSnapshotPanelOpen(false);
              }}
              onDiffChange={setDiffResult}
            />
          )}
        </AnimatePresence>

        {/* 🌿 Branch Panel */}
        <AnimatePresence>
          {branchPanelOpen && (
            <BranchPanel
              currentGraphState={{ nodes, edges }}
              onRestore={(restoredNodes, restoredEdges) => {
                setNodes(restoredNodes);
                setEdges(restoredEdges);
                setNodeCount(restoredNodes.length + 1);
                setToast({
                  type: "restore",
                  message: "✅ Branch switched",
                });
                setTimeout(() => setToast(null), 3000);
              }}
              onBranchSwitch={(branch) => {
                setActiveBranch(branch);
                if (branch) {
                  setToast({
                    type: "restore",
                    message: `🌿 Branch: ${branch.name}`,
                  });
                } else {
                  setToast({
                    type: "restore",
                    message: "🌿 Main branch",
                  });
                }
                setTimeout(() => setToast(null), 3000);
              }}
              onVisualizerToggle={setVisualizerOpen}
              onPlaybackClick={() => setPlaybackPanelOpen(true)}
            />
          )}
        </AnimatePresence>

        {/* ⏳ Timeline Playback Panel */}
        <AnimatePresence>
          {playbackPanelOpen && (
            <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <TimelinePlayer
                onSnapshotChange={handlePlaybackSnapshotChange}
                onClose={handlePlaybackClose}
              />
            </div>
          )}
        </AnimatePresence>

        {/* 🧠 React Flow Graph */}
        <ReactFlowProvider>
          <GraphFlowWithHotkeys
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodeDragStop={onNodeDragStop}
            onNodeContextMenu={onNodeContextMenu}
            contextNode={contextNode}
            menuPos={menuPos}
            closeContextMenu={closeContextMenu}
            filteredNodes={filteredNodes}
            edges={edges}
            setNodes={setNodes}
            withGlow={withGlow}
            setActiveNodeId={setActiveNodeId}
            searchRef={searchRef}
            isEditableTarget={isEditableTarget}
            isLoading={isLoading}
            hasNodes={nodes?.length > 0}
          />
        </ReactFlowProvider>

        {/* 🔹 Rechtes Notiz-Panel */}
        <ThoughtPanel
          isForcedOpen={panelOpen}
          onPanelClose={() => {
            setPanelOpen(false);
            void saveSession({
              activeId: null,
              panel: false,
            });
          }}
        />

        {/* 🎯 Inline Meta-Editor */}
        <AnimatePresence>
          {activeNode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute bg-filon-surface/95 backdrop-blur-md border border-filon-glow/20 rounded-xl p-md shadow-glow text-sm z-50 w-[320px]"
              style={{
                left: Math.min(
                  activeNode.position.x + 240,
                  typeof window !== "undefined"
                    ? window.innerWidth - 340
                    : activeNode.position.x + 240
                ),
                top: Math.min(
                  activeNode.position.y,
                  typeof window !== "undefined"
                    ? window.innerHeight - 220
                    : activeNode.position.y
                ),
              }}
            >
              <h3 className="text-filon-glow font-semibold mb-sm">
                🧠 {activeNode.data?.label}
              </h3>

              {/* Label Editor */}
              <label className="block text-xs mb-xs text-filon-text opacity-80">
                Label
              </label>
              <input
                defaultValue={activeNode.data?.label || ""}
                onBlur={async (e) => {
                  if (e.target.value !== activeNode.data?.label) {
                    try {
                      await fetch("/api/nodes/update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: activeNode.id,
                          label: e.target.value,
                        }),
                      });
                      loadFromServer();
                    } catch (err) {
                      console.error("Update error:", err);
                    }
                  }
                }}
                className="w-full bg-filon-bg text-filon-text border border-filon-glow rounded px-sm py-xs mb-sm outline-none focus:border-filon-accent transition-colors duration-fast"
              />

              {/* Note Editor */}
              <label className="block text-xs mb-xs text-filon-text opacity-80">
                Note
              </label>
              <textarea
                defaultValue={activeNode.data?.note || ""}
                onBlur={async (e) => {
                  if (e.target.value !== activeNode.data?.note) {
                    try {
                      await fetch("/api/nodes/update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          id: activeNode.id,
                          note: e.target.value,
                        }),
                      });
                      loadFromServer();
                    } catch (err) {
                      console.error("Update error:", err);
                    }
                  }
                }}
                className="w-full bg-filon-bg text-filon-text border border-filon-glow rounded px-sm py-xs mb-sm outline-none focus:border-filon-accent transition-colors duration-fast resize-none"
                rows={2}
              />

              {/* Quick Actions */}
              <div className="flex items-center gap-xs mt-sm flex-wrap">
                <button
                  onClick={async () => {
                    try {
                      await fetch("/api/graph/duplicate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ nodeId: activeNode.id }),
                      });
                      loadFromServer();
                      setToast({ type: "save", message: "✅ Node duplicated" });
                      setTimeout(() => setToast(null), 2000);
                    } catch (err) {
                      console.error("Duplicate error:", err);
                      setToast({
                        type: "error",
                        message: "❌ Failed to duplicate",
                      });
                      setTimeout(() => setToast(null), 2000);
                    }
                  }}
                  className="px-xs py-xs bg-filon-accent text-filon-bg rounded hover:brightness-110 transition-all duration-fast text-xs"
                >
                  🔄 Duplicate
                </button>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      JSON.stringify(activeNode, null, 2)
                    );
                    setToast({ type: "save", message: "📋 Node copied" });
                    setTimeout(() => setToast(null), 2000);
                  }}
                  className="px-xs py-xs bg-filon-accent text-filon-bg rounded hover:brightness-110 transition-all duration-fast text-xs"
                >
                  📋 Copy
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`Delete "${activeNode.data?.label}"?`)) return;
                    try {
                      await fetch("/api/graph/delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ nodeId: activeNode.id }),
                      });
                      loadFromServer();
                      setToast({ type: "save", message: "🗑️ Node deleted" });
                      setTimeout(() => setToast(null), 2000);
                    } catch (err) {
                      console.error("Delete error:", err);
                      setToast({
                        type: "error",
                        message: "❌ Failed to delete",
                      });
                      setTimeout(() => setToast(null), 2000);
                    }
                    setActiveNode(null);
                  }}
                  className="px-xs py-xs bg-red-600 text-white rounded hover:brightness-110 transition-all duration-fast text-xs"
                >
                  🗑️ Delete
                </button>
              </div>

              {/* Connections */}
              {edges.filter(
                (e) => e.source === activeNode.id || e.target === activeNode.id
              ).length > 0 && (
                <div className="mt-sm border-t border-filon-glow/30 pt-sm">
                  <h4 className="text-xs text-filon-glow/70 mb-xs font-medium">
                    Verknüpfungen
                  </h4>
                  {edges
                    .filter(
                      (e) =>
                        e.source === activeNode.id || e.target === activeNode.id
                    )
                    .slice(0, 5)
                    .map((e) => {
                      const connectedNode =
                        e.source === activeNode.id
                          ? nodes.find((n) => n.id === e.target)
                          : nodes.find((n) => n.id === e.source);
                      return (
                        <div
                          key={e.id}
                          className="text-xs text-filon-text/70 flex items-center gap-xs"
                        >
                          {e.source === activeNode.id ? "→" : "←"}
                          <span className="truncate">
                            {connectedNode?.data?.label || "Unknown"}
                          </span>
                        </div>
                      );
                    })}
                  {edges.filter(
                    (e) =>
                      e.source === activeNode.id || e.target === activeNode.id
                  ).length > 5 && (
                    <div className="text-xs text-filon-text/50 mt-xs">
                      +
                      {edges.filter(
                        (e) =>
                          e.source === activeNode.id ||
                          e.target === activeNode.id
                      ).length - 5}{" "}
                      more
                    </div>
                  )}
                </div>
              )}

              {/* Close Button */}
              <button
                className="mt-sm w-full px-sm py-xs bg-filon-accent text-filon-bg rounded hover:brightness-110 shadow-glow transition-all duration-fast text-xs font-medium"
                onClick={() => setActiveNode(null)}
              >
                Schließen
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔔 Toast Notifications */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] 
                         bg-zinc-800 text-white px-4 py-3 rounded-lg shadow-2xl
                         border border-zinc-700 min-w-[300px] text-center"
            >
              <p className="text-sm font-medium">{toast.message}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🧠 Learning Summary Panel */}
        {/* TODO: Re-enable when properly styled */}
        {/* <LearningSummaryPanel /> */}

        {/* 🎯 Insights Panel */}
        <InsightsPanel
          visible={insightsPanelOpen}
          onClose={() => setInsightsPanelOpen(false)}
        />
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
  onNodeContextMenu,
  contextNode,
  menuPos,
  closeContextMenu,
  filteredNodes,
  edges,
  setNodes,
  withGlow,
  setActiveNodeId,
  searchRef,
  isEditableTarget,
  isLoading,
  hasNodes,
}: {
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeClick: NodeMouseHandler;
  onPaneClick: () => void;
  onNodeDragStop: NodeMouseHandler;
  onNodeContextMenu: NodeMouseHandler;
  contextNode: Node | null;
  menuPos: { x: number; y: number } | null;
  closeContextMenu: () => void;
  filteredNodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  withGlow: (n: Node, active: boolean) => Node;
  setActiveNodeId: (id: string | null) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  isEditableTarget: (e: EventTarget | null) => boolean;
  isLoading: boolean;
  hasNodes: boolean;
}) {
  const rf = useReactFlow();
  const { currentMindState } = useMindProgress();
  const mood = getMoodPreset(currentMindState);

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
      // Zoom to fit all nodes after adding
      setTimeout(() => {
        rf.fitView({ padding: 0.2 });
      }, 100);
    },
    [setNodes, rf]
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
    <div
      id="canvas-shell"
      className="flex w-full flex-1 justify-center bg-[#0a0a0a] px-6 pb-6 pt-4"
    >
      <div
        id="graph-container"
        role="region"
        aria-label="Thought Graph"
        className="relative flex-1 min-h-[80vh] w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--background)] shadow-[var(--shadow-soft)]"
        style={{ height: "calc(100vh - 4rem)" }}
      >
        <style>
          {`
            #graph-container .react-flow {
              background: radial-gradient(circle at 50% 50%, ${
                mood.moodColor
              }08, #0a0a0a 80%) !important;
              transition: background var(--filon-transition-medium) ease-in-out !important;
            }
            #graph-container .react-flow__pane {
              filter: drop-shadow(0 0 ${mood.glowIntensity * 15}px ${
            mood.moodColor
          });
              transition: filter var(--filon-transition-medium) ease-in-out !important;
            }
          `}
        </style>
        <ReactFlow
          className="react-flow-canvas"
          nodes={filteredNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onNodeDragStop={onNodeDragStop}
          onNodeContextMenu={onNodeContextMenu}
          fitView
          minZoom={0.25}
          maxZoom={1.5}
          panOnDrag
          zoomOnScroll
          proOptions={{ hideAttribution: true }}
          style={{ width: "100%", height: "100%" }}
        >
          <Background color="rgba(47,243,255,0.08)" gap={20} size={1} />
          <Controls
            position="bottom-right"
            style={{ color: "var(--accent)" }}
            showInteractive
          />
          <MiniMap
            nodeColor={() => "#2ff3ff"}
            maskColor="rgba(10,15,18,0.85)"
            style={{ borderRadius: "8px" }}
          />
        </ReactFlow>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--background)]/85 backdrop-blur-sm">
            <div className="text-filon-glow text-lg font-medium">
              💫 Lade Graph…
            </div>
          </div>
        )}
        {!isLoading && !hasNodes && (
          <div className="pointer-events-none absolute left-6 top-6 z-10 rounded border border-cyan-500/30 bg-black/70 px-4 py-2 text-sm font-semibold text-cyan-200">
            ⚠️ No nodes rendered
          </div>
        )}
      </div>
      {menuPos && contextNode && (
        <div
          className="fixed z-40 bg-filon-surface border border-filon-glow rounded p-xs text-sm shadow-glow animate-fade-in"
          style={{ left: menuPos.x, top: menuPos.y }}
        >
          <ContextMenu node={contextNode} closeMenu={closeContextMenu} />
        </div>
      )}
    </div>
  );
}

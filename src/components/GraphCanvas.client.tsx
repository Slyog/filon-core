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
  type ReactFlowInstance,
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
import FeedbackToast from "@/components/FeedbackToast";
import SaveStatusBar from "@/components/SaveStatusBar";
import MemoryPanel from "@/components/MemoryPanel";
import { attachRFDebug } from "@/utils/rfDebug";
import { DEBUG_MODE } from "@/utils/env";
import { useFeedbackStore } from "@/store/FeedbackStore";
import { useMemoryStore } from "@/store/MemoryStore";
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
import { bbox } from "@/utils/rfDebug";
import dynamic from "next/dynamic";
import { startVoiceCapture } from "@/lib/voiceInput";
import { useThoughtType } from "@/hooks/useThoughtType";

// 🌀 dynamic import: RFDebugPanel loaded only in dev
const RFDebugPanel = DEBUG_MODE
  ? dynamic(() => import("@/components/RFDebugPanel"), { ssr: false })
  : () => null;

// --- View & Layout Sanity Utils ---
type RFNode = import("reactflow").Node;

function normalizeNodes<T extends RFNode>(
  nodes: T[],
  gridX = 240,
  gridY = 140
) {
  if (!nodes.length) return { changed: false, nodes } as const;

  const { minX, minY, w, h } = bbox(nodes);

  const tooFar =
    Math.abs(minX) > 20000 || Math.abs(minY) > 20000 || w > 50000 || h > 50000;
  const collapsed = w < 10 && h < 10;

  if (tooFar || collapsed) {
    const fixed = nodes.map((n, i) => ({
      ...n,
      position: {
        x: (i % 5) * gridX,
        y: Math.floor(i / 5) * gridY,
      },
    }));
    return { changed: true, nodes: fixed as T[] } as const;
  }

  const dx = minX < 0 ? -minX + 100 : 0;
  const dy = minY < 0 ? -minY + 100 : 0;

  if (dx !== 0 || dy !== 0) {
    const shifted = nodes.map((n) => ({
      ...n,
      position: {
        x: (n.position?.x ?? 0) + dx,
        y: (n.position?.y ?? 0) + dy,
      },
    }));
    return { changed: true, nodes: shifted as T[] } as const;
  }

  return { changed: false, nodes } as const;
}

export const GraphContext = createContext<{
  updateNodeNote: (id: string, note: string) => void;
} | null>(null);

type SaveState = "idle" | "saving" | "saved" | "error" | "conflict";
type ToastType = "restore" | "save" | "recovery" | "error" | null;

export default function GraphCanvas() {
  const { activeNodeId, setActiveNodeId } = useActiveNode();
  const { currentMindState, setCurrentMindState } = useMindProgress();
  const addFeedback = useFeedbackStore((s) => s.add);
  const setStatus = useFeedbackStore((s) => s.setStatus);
  const addMemory = useMemoryStore((s) => s.addSnapshot);
  const getTrend = useMemoryStore((s) => s.getTrend);
  const { getType } = useThoughtType();
  const [motionTest, setMotionTest] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [graphLoadedOnce, setGraphLoadedOnce] = useState(false);
  const [contextNode, setContextNode] = useState<Node | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [activeNode, setActiveNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [snapshotPanelOpen, setSnapshotPanelOpen] = useState(false);
  const [branchPanelOpen, setBranchPanelOpen] = useState(false);
  const [visualizerOpen, setVisualizerOpen] = useState(false);
  const [playbackPanelOpen, setPlaybackPanelOpen] = useState(false);
  const [insightsPanelOpen, setInsightsPanelOpen] = useState(false);
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [playbackActive, setPlaybackActive] = useState(false);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(
    null
  );
  const [layoutTrigger, setLayoutTrigger] = useState(0);
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
    let mounted = true;

    (async () => {
      setIsLoading(true);
      try {
        // Clean up expired snapshots and feedback events on mount
        await clearSnapshots();
        await cleanupOldFeedback();

        // Try to restore from session manager first
        const savedGraphState = await loadGraphState();
        if (!mounted) return;

        if (savedGraphState) {
          setNodes(styleNodes(savedGraphState.nodes ?? []));
          setEdges(savedGraphState.edges ?? []);
          setLayoutTrigger((n) => n + 1);
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
        if (!mounted) return;

        if (result?.merged) {
          setNodes(styleNodes(result.merged.nodes ?? []));
          setEdges(result.merged.edges ?? []);
          setLayoutTrigger((n) => n + 1);

          // Konflikte loggen
          if (result.conflicts.length > 0) {
            console.warn(
              `⚠️ ${result.conflicts.length} Konflikte automatisch aufgelöst`
            );
          }
        }

        // 🌿 Load active branch
        const activeBranchId = await getActiveBranch();
        if (!mounted) return;

        if (activeBranchId) {
          const branch = await getBranch(activeBranchId);
          if (branch) {
            setActiveBranch(branch);
          }
        }
      } catch (err) {
        console.error("Failed to load graph:", err);
      } finally {
        if (mounted) {
          // Reset active node states after load to prevent stale data
          setActiveNode(null);
          setActiveNodeId(null);
          setIsLoading(false);
          setGraphLoadedOnce(true); // ✅ Lock the render after first success
          setTimeout(() => setHasAnimated(true), 100); // after fade
        }
      }
    })();

    return () => {
      mounted = false;
    };
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
      setStatus("saving", "💾 Saving...");
      hasUnsavedChangesRef.current = true;

      saveDebounceRef.current = setTimeout(async () => {
        const saveStartTime = Date.now();
        try {
          const when = Date.now();
          await saveGraphRemote({ nodes: n, edges: e });

          // Also save to session manager for crash recovery
          await saveGraphState({ nodes: n, edges: e });

          // Log successful save (legacy + new toast)
          await addFeedbackEvent({
            timestamp: when,
            type: "save",
            details: { nodeCount: n.length, edgeCount: e.length },
            success: true,
            duration: Date.now() - saveStartTime,
          });
          addFeedback({ type: "success", message: "☁️ Synced to cloud" });
          setStatus("synced", "☁️ Synced to cloud");

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
                    addFeedback({
                      type: "success",
                      message: `🧠 Snapshot + Insight: ${summary}`,
                    });

                    // Add to memory store and show trend
                    addMemory({
                      id: snapshotId,
                      timestamp: when,
                      summary,
                      nodes: n.length,
                      edges: e.length,
                    });
                    const trend = getTrend();
                    if (trend !== "Noch keine Trends.") {
                      addFeedback({ type: "info", message: `📈 ${trend}` });
                    }
                  }
                }
              }
            } else {
              addFeedback({
                type: "success",
                message: "📜 Snapshot created",
              });
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
          setTimeout(() => setStatus("idle", ""), 2000);
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
          addFeedback({
            type: "error",
            message: "⚠️ Offline – local backup only",
          });
          setStatus("offline", "⚠️ Offline – local backup only");

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
                    addFeedback({
                      type: "success",
                      message: `🧠 Snapshot + Insight: ${summary}`,
                    });
                  }
                }
              }
            } else {
              addFeedback({
                type: "success",
                message: "📜 Snapshot created",
              });
            }
          } else {
            nodeChangeCountRef.current++;
          }

          setSaveState("error");
          hasUnsavedChangesRef.current = false;
        }
      }, 800);
    },
    [activeBranch, addFeedback, addMemory, getTrend, setStatus]
  );

  // Selektions-Glow als Helper (keine globalen Styles anfassen)
  const withGlow = useCallback(
    (n: Node, active: boolean, hoveredOverride?: boolean) => {
      const baseStyle = n.style ?? {};
      const isHovered = hoveredOverride ?? hoveredNodeId === n.id;
      return {
        ...n,
        selected: active,
        style: {
          ...baseStyle,
          transition: "box-shadow 0.4s ease, border 0.25s ease",
          boxShadow: active
            ? "0 0 20px rgba(47,243,255,0.8)"
            : isHovered
            ? "0 0 10px rgba(47,243,255,0.4)"
            : "0 0 0 rgba(0,0,0,0)",
          border: active
            ? "1px solid rgba(47,243,255,0.5)"
            : "1px solid transparent",
          outline: active ? "2px solid #2FF3FF" : undefined,
          outlineOffset: active ? "2px" : undefined,
        },
      };
    },
    [hoveredNodeId]
  );

  // 🔄 Node & Edge Handlers
  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);
        const styled = updated.map((node) =>
          withGlow(node, node.id === activeNodeId, hoveredNodeId === node.id)
        );
        saveGraph(styled, edges);
        return styled;
      });
    },
    [edges, saveGraph, withGlow, activeNodeId, hoveredNodeId]
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

  const styleNodes = useCallback(
    (list: Node[], activeId: string | null = null) =>
      list.map((node) =>
        withGlow(node, activeId ? node.id === activeId : node.selected ?? false)
      ),
    [withGlow]
  );

  useEffect(() => {
    if (!flowInstance || nodes.length === 0) return;

    let changed = false;
    const fixed = nodes.map((node, index) => {
      const hasPos =
        node.position &&
        typeof node.position.x === "number" &&
        typeof node.position.y === "number";

      if (!hasPos || (node.position!.x === 0 && node.position!.y === 0)) {
        changed = true;
        return {
          ...node,
          position: {
            x: (index % 5) * 220,
            y: Math.floor(index / 5) * 140,
          },
        };
      }

      return node;
    });

    if (!changed) return;

    const styled = styleNodes(fixed);
    setNodes(styled);
    saveGraph(styled, edges);

    const timeout = window.setTimeout(() => {
      try {
        flowInstance.fitView({ padding: 0.3, duration: 800 });
      } catch (err) {
        console.warn("fitView failed", err);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [flowInstance, nodes.length, styleNodes, saveGraph, edges]);

  useEffect(() => {
    if (!layoutTrigger || !flowInstance) return;
    const timeout = window.setTimeout(() => {
      try {
        flowInstance.fitView({ padding: 0.3, duration: 800 });
      } catch (err) {
        console.warn("fitView failed", err);
      }
      setLayoutTrigger(0); // Reset trigger after fitView
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [layoutTrigger, flowInstance]);

  useEffect(() => {
    if (!flowInstance) return;
    if (!nodes.length) return;

    const result = normalizeNodes(nodes);
    if (result.changed) {
      setNodes(result.nodes);
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            flowInstance.fitView({ padding: 0.35, duration: 800 });
          } catch (err) {
            console.warn("fitView normalization failed", err);
          }
        }, 250);
      });
      return;
    }

    const { minX, minY, w, h } = bbox(nodes);
    const absurd =
      Math.abs(minX) > 10000 ||
      Math.abs(minY) > 10000 ||
      w > 20000 ||
      h > 20000;
    const collapsed = w < 10 && h < 10;

    if (layoutTrigger > 0 || absurd || collapsed) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            flowInstance.fitView({ padding: 0.35, duration: 800 });
          } catch (err) {
            console.warn("fitView auto-adjust failed", err);
          }
        }, 250);
      });
      if (layoutTrigger > 0) {
        setLayoutTrigger(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowInstance, nodes.length, layoutTrigger]);

  // 🪄 Einheitlicher Hover/Selection-Style anwenden
  // REMOVED: This was causing infinite loops. Styling is now handled in onNodesChange

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
      setNodes(styleNodes(snapshot.nodes ?? []));
      setLayoutTrigger((n) => n + 1); // Trigger layout update
      setEdges(snapshot.edges ?? []);
    },
    [nodes, edges, originalGraphState, playbackActive, styleNodes]
  );

  const handlePlaybackClose = useCallback(() => {
    setPlaybackPanelOpen(false);
    setPlaybackActive(false);

    // Restore original state if exists
    if (originalGraphState) {
      setNodes(styleNodes(originalGraphState.nodes));
      setLayoutTrigger((n) => n + 1); // Trigger layout update
      setEdges(originalGraphState.edges);
      setOriginalGraphState(null);

      setToast({
        type: "restore",
        message: "⏹ Playback stopped",
      });
      setTimeout(() => setToast(null), 3000);
    }
  }, [originalGraphState, styleNodes]);

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
    setHoveredNodeId(null);
    void saveSession({ activeId: null, panel: false });
  }, [setNodes, setActiveNodeId, withGlow, setHoveredNodeId]);

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

  const onNodeMouseEnter: NodeMouseHandler = useCallback((_, node) => {
    setHoveredNodeId(node.id);
  }, []);

  const onNodeMouseLeave: NodeMouseHandler = useCallback(() => {
    setHoveredNodeId(null);
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
  const addNode = useCallback(
    (label?: string, thoughtType?: string) => {
      if (!flowInstance) return;

      const center = flowInstance.screenToFlowPosition({
        x: window.innerWidth / 2 - 120 + (Math.random() * 100 - 50),
        y: window.innerHeight / 2 - 60 + (Math.random() * 100 - 50),
      });

      const newNode: Node = {
        id: `node_${Date.now()}`,
        position: center,
        data: {
          label: label || `Neuer Gedanke ${nodes.length + 1}`,
          thoughtType: thoughtType || "Idea",
        },
        type: "default",
      };

      setNodes((nds) => {
        const updated = [...nds, withGlow(newNode, false)];
        saveGraph(updated, edges);
        return updated;
      });
      setLayoutTrigger((n) => n + 1);

      setTimeout(() => {
        try {
          flowInstance.fitView({ padding: 0.3, duration: 600 });
        } catch (err) {
          console.warn("fitView failed", err);
        }
      }, 150);
    },
    [flowInstance, nodes.length, withGlow, saveGraph, edges]
  );

  // 🎯 Welcome Hub helpers
  const handleCreateThought = useCallback(async () => {
    const thoughtType = await getType();
    addNode("New Thought", thoughtType);
    addFeedback({
      type: "success",
      message: `🧠 ${thoughtType} thought created`,
    });
  }, [addNode, getType, addFeedback]);

  const startVoiceInput = useCallback(async () => {
    console.log("🎙 Voice input started...");
    setStatus("saving", "🎙 Listening...");
    const transcript = await startVoiceCapture();

    if (transcript) {
      const label = transcript.slice(0, 120);
      const thoughtType = await getType();
      addNode(label, thoughtType);
      addFeedback({ type: "success", message: `🎧 Captured: "${label}"` });
      addFeedback({
        type: "info",
        message: `🧠 ${thoughtType} thought created`,
      });
      setStatus("synced", "☁️ Voice thought created");
      setTimeout(() => setStatus("idle", ""), 2000);
    } else {
      addFeedback({ type: "error", message: "⚠️ No speech detected" });
      setStatus("offline", "Voice capture failed or unsupported");
      setTimeout(() => setStatus("idle", ""), 2000);
    }
  }, [addNode, addFeedback, setStatus, getType]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const preview = text.slice(0, 200).trim();
        const thoughtType = await getType();
        addNode(preview, thoughtType);
        addFeedback({ type: "success", message: "📄 File imported" });
        addFeedback({
          type: "info",
          message: `🧠 ${thoughtType} thought created`,
        });
      } catch (err) {
        console.error("File upload error:", err);
        addFeedback({ type: "error", message: "❌ Failed to read file" });
      }
    },
    [addNode, addFeedback, getType]
  );

  // 🧹 Graph löschen
  const clearGraph = useCallback(async () => {
    setNodes([]);
    setEdges([]);
    setHoveredNodeId(null);
    setActiveNode(null); // ✅ clear active node state
    setActiveNodeId(null); // ✅ clear selection
    console.log("All nodes cleared and selection reset.");
    await localforage.removeItem("noion-graph");
    const keys = await localforage.keys();
    for (const key of keys)
      if (key.startsWith("note-")) await localforage.removeItem(key);
  }, [setActiveNodeId]);

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
      setNodes(styleNodes(data.nodes ?? []));
      setLayoutTrigger((n) => n + 1); // Trigger layout update
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

    const activeMatchId =
      selectedIndex >= 0 && selectedIndex < filteredNodes.length
        ? filteredNodes[selectedIndex].id
        : null;

    // Nur visuellen Zustand aktualisieren (einmal pro Indexwechsel)
    setNodes((nds) =>
      nds.map((n) => {
        const isMatch = n.data.label
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const isActive = !!activeMatchId && n.id === activeMatchId;
        const enhanced = withGlow(n, isActive, hoveredNodeId === n.id);
        if (!isActive && isMatch && hoveredNodeId !== n.id) {
          return {
            ...enhanced,
            style: {
              ...enhanced.style,
              boxShadow: "0 0 8px rgba(47,243,255,0.35)",
            },
          };
        }
        if (!isActive && !isMatch && hoveredNodeId !== n.id) {
          return {
            ...enhanced,
            style: {
              ...enhanced.style,
              boxShadow: "0 0 0 rgba(0,0,0,0)",
            },
          };
        }
        return enhanced;
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
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed top-0 left-0 z-50 flex h-14 w-full items-center border-b border-[var(--border-glow)] bg-[rgba(10,15,18,0.7)] px-6 shadow-[var(--shadow-soft)] backdrop-blur-md"
        >
          <div className="flex w-full items-center gap-sm overflow-x-auto">
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
                      nds.map((n) =>
                        withGlow(n, n.id === current.id, hoveredNodeId === n.id)
                      )
                    );
                  }
                  return;
                }

                // Esc → Suche leeren & Auswahl zurücksetzen
                if (e.key === "Escape") {
                  e.preventDefault();
                  setSearchTerm("");
                  setSelectedIndex(-1);
                  setNodes((nds) => nds.map((n) => withGlow(n, false, false)));
                  setHoveredNodeId(null);
                  return;
                }
              }}
              className="px-sm py-xs rounded-lg bg-filon-surface text-filon-text text-sm outline-none transition-all duration-fast focus-glow"
              aria-label="Search nodes"
            />
            <button
              onClick={() => addNode()}
              className="focus-glow px-sm py-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-md transition-all duration-fast"
              aria-label="Add new node"
            >
              + Node
            </button>
            <button
              onClick={clearGraph}
              className="focus-glow px-sm py-xs rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium shadow-md transition-all duration-fast"
              aria-label="Clear graph"
            >
              Clear
            </button>
            <button
              onClick={saveToServer}
              className="focus-glow px-sm py-xs rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium shadow-md transition-all duration-fast"
              aria-label="Save graph to database"
            >
              💾 Save DB
            </button>
            <button
              onClick={loadFromServer}
              className="focus-glow px-sm py-xs rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium shadow-md transition-all duration-fast"
              aria-label="Load graph from database"
            >
              📥 Load DB
            </button>
            <button
              onClick={() => setSnapshotPanelOpen(!snapshotPanelOpen)}
              role="button"
              aria-label={
                snapshotPanelOpen
                  ? "Close Snapshot Panel"
                  : "Open Snapshot Panel"
              }
              className={`focus-glow px-sm py-xs rounded-lg text-white text-sm font-medium shadow-md transition-all duration-fast ${
                snapshotPanelOpen
                  ? "bg-purple-700 hover:bg-purple-600 border-2 border-purple-400"
                  : "bg-purple-600 hover:bg-purple-500"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="text-base">🕒</span>
                <span>
                  {snapshotPanelOpen ? "Close Snapshots" : "Snapshots"}
                </span>
              </span>
            </button>
            <button
              onClick={() => setBranchPanelOpen(!branchPanelOpen)}
              role="button"
              aria-label={
                branchPanelOpen ? "Close Branch Panel" : "Open Branch Panel"
              }
              className={`focus-glow px-sm py-xs rounded-lg text-white text-sm font-medium shadow-md transition-all duration-fast ${
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
              className="focus-glow px-sm py-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-md transition-all duration-fast"
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
              className={`focus-glow px-sm py-xs rounded-lg text-white text-sm font-medium shadow-md transition-all duration-fast ${
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
              className="focus-glow px-sm py-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-md transition-all duration-fast"
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
              className="focus-glow px-sm py-xs rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium shadow-md transition-all duration-fast"
              aria-label="Import graph from clipboard"
            >
              📥 Import Graph
            </button>
            <button
              onClick={() => {
                flowInstance?.fitView({ padding: 0.35, duration: 600 });
              }}
              className="focus-glow px-sm py-xs rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium shadow-md transition-all duration-fast"
              aria-label="Reset viewport to fit all nodes"
            >
              🔍 Reset View
            </button>
            <button
              onClick={() => {
                if (!flowInstance || !nodes.length) return;
                const result = normalizeNodes(nodes);
                if (result.changed) {
                  setNodes(result.nodes);
                }
                setLayoutTrigger((n) => n + 1);
                setTimeout(() => {
                  try {
                    flowInstance.fitView({ padding: 0.35, duration: 600 });
                  } catch (err) {
                    console.warn("fitView recenter failed", err);
                  }
                }, 200);
              }}
              className="focus-glow px-sm py-xs rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium shadow-md transition-all duration-fast"
              aria-label="Recenter graph and normalize positions"
            >
              🧭 Recenter Graph
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
              className="focus-glow px-sm py-xs rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium shadow-md transition-all duration-fast"
              aria-label="Duplicate selected node"
            >
              🔄 Duplicate Node
            </button>

            {/* 🌐 Language Toggle (placeholder for i18n) */}
            <select
              className="ml-auto bg-transparent border border-[var(--accent)] rounded-md text-sm px-2 py-1 focus-glow"
              defaultValue="en"
              onChange={(e) => console.log("Language:", e.target.value)}
            >
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="es">Español</option>
            </select>
          </div>
        </motion.header>

        {/* 💾 Status Badge */}
        <div className="absolute top-20 right-4 z-50">
          <SaveStatusBadge state={saveState} />
        </div>

        {/* 🔵 Session Badge */}
        <div className="absolute top-24 right-2 z-50">
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
          <div className="absolute top-24 left-2 z-50">
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
                setNodes(styleNodes(restoredNodes));
                setEdges(restoredEdges);
                setLayoutTrigger((n) => n + 1);
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
                setNodes(styleNodes(restoredNodes));
                setEdges(restoredEdges);
                setLayoutTrigger((n) => n + 1);
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

        {/* 🎯 Welcome Hub (empty graph state) */}
        {nodes.length === 0 && graphLoadedOnce && !isLoading && (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center text-[var(--foreground)] space-y-6 welcome-fadein pt-20">
            <h2 className="text-2xl font-semibold text-[var(--accent)]">
              Begin your first thought 💭
            </h2>

            <p className="text-[var(--muted)] max-w-md">
              Speak, write, or upload a file — FILON will turn it into glowing
              ideas.
              <br />
              <span className="opacity-70 text-sm">
                Choose a type after recording (e.g., Idea, Knowledge, Guide,
                Inspiration).
              </span>
            </p>

            <div className="flex gap-4">
              <button
                className="px-6 py-2 rounded-xl bg-[var(--accent)] text-black hover:opacity-90 transition-all duration-fast focus-glow"
                onClick={handleCreateThought}
              >
                ✏️ New Text Thought
              </button>

              <button
                className="px-6 py-2 rounded-xl border border-[var(--accent)] hover:bg-[rgba(47,243,255,0.1)] transition-all duration-fast focus-glow"
                onClick={startVoiceInput}
              >
                🎙️ Voice Input
              </button>

              <label className="cursor-pointer px-6 py-2 rounded-xl border border-[var(--accent)] hover:bg-[rgba(47,243,255,0.1)] transition-all duration-fast focus-glow">
                📄 Upload File
                <input
                  type="file"
                  accept=".txt,.md,.pdf"
                  hidden
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            <p className="text-xs opacity-60">
              *Language settings coming soon — English / Deutsch / more*
            </p>
          </div>
        )}

        {/* 🧠 React Flow Graph */}
        {nodes.length > 0 && (
          <ReactFlowProvider>
            <GraphFlowWithHotkeys
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onNodeDragStop={onNodeDragStop}
              onNodeContextMenu={onNodeContextMenu}
              onNodeMouseEnter={onNodeMouseEnter}
              onNodeMouseLeave={onNodeMouseLeave}
              registerInstance={setFlowInstance}
              contextNode={contextNode}
              menuPos={menuPos}
              closeContextMenu={closeContextMenu}
              filteredNodes={filteredNodes}
              rawNodes={nodes}
              edges={edges}
              setNodes={setNodes}
              withGlow={withGlow}
              setActiveNodeId={setActiveNodeId}
              searchRef={searchRef}
              isEditableTarget={isEditableTarget}
              isLoading={isLoading}
              hasNodes={nodes?.length > 0}
              hasAnimated={hasAnimated}
              graphLoadedOnce={graphLoadedOnce}
            />
          </ReactFlowProvider>
        )}

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
  onNodeMouseEnter,
  onNodeMouseLeave,
  registerInstance,
  contextNode,
  menuPos,
  closeContextMenu,
  filteredNodes,
  rawNodes,
  edges,
  setNodes,
  withGlow,
  setActiveNodeId,
  searchRef,
  isEditableTarget,
  isLoading,
  hasNodes,
  hasAnimated,
  graphLoadedOnce,
}: {
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeClick: NodeMouseHandler;
  onPaneClick: () => void;
  onNodeDragStop: NodeMouseHandler;
  onNodeContextMenu: NodeMouseHandler;
  onNodeMouseEnter: NodeMouseHandler;
  onNodeMouseLeave: NodeMouseHandler;
  registerInstance: (instance: ReactFlowInstance) => void;
  contextNode: Node | null;
  menuPos: { x: number; y: number } | null;
  closeContextMenu: () => void;
  filteredNodes?: Node[];
  rawNodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  withGlow: (n: Node, active: boolean, hovered?: boolean) => Node;
  setActiveNodeId: (id: string | null) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  isEditableTarget: (e: EventTarget | null) => boolean;
  isLoading: boolean;
  hasNodes: boolean;
  hasAnimated: boolean;
  graphLoadedOnce: boolean;
}) {
  const rf = useReactFlow();
  const { currentMindState } = useMindProgress();
  const mood = getMoodPreset(currentMindState);

  // 🎯 Wrap registerInstance to trigger initial fitView
  const handleInit = useCallback(
    (instance: ReactFlowInstance) => {
      registerInstance(instance);
      if (DEBUG_MODE) {
        attachRFDebug(instance, () => rawNodes); // Debug an Fenster hängen
      }
      requestAnimationFrame(() => {
        setTimeout(() => {
          try {
            instance.fitView({ padding: 0.35, duration: 600 });
          } catch (e) {
            if (DEBUG_MODE) console.warn("fitView init failed", e);
          }
        }, 200);
      });
    },
    [registerInstance, rawNodes]
  );

  const addNodeAt = useCallback(
    (pos?: XYPosition) => {
      setNodes((nds) => {
        const id = `n_${Date.now()}`;
        const cleared = nds.map((node) => withGlow(node, false));
        const jitterX = Math.random() * 100 - 50;
        const jitterY = Math.random() * 100 - 50;
        const center = pos
          ? pos
          : rf.screenToFlowPosition({
              x: window.innerWidth / 2 - 120 + jitterX,
              y: window.innerHeight / 2 - 60 + jitterY,
            });
        const baseNode: Node = {
          id,
          position: center,
          data: { label: "🧠 Neuer Gedanke", note: "" },
          type: "default",
          selected: true,
          style: {
            background: "#475569",
            color: "white",
            padding: 10,
            borderRadius: 8,
            cursor: "pointer",
          },
        };
        const styledNewNode = withGlow(baseNode, true);
        return [...cleared, styledNewNode];
      });

      window.setTimeout(() => {
        try {
          rf.fitView({ padding: 0.25, duration: 600 });
        } catch (err) {
          console.warn("fitView failed", err);
        }
      }, 200);
    },
    [setNodes, rf, withGlow]
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
        setNodes((nds) => nds.map((n) => withGlow(n, false)));
        setActiveNodeId(null);
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    rf,
    addNodeAt,
    setNodes,
    setActiveNodeId,
    searchRef,
    isEditableTarget,
    withGlow,
  ]);

  return (
    <div
      id="canvas-shell"
      className="flex w-full flex-1 justify-center bg-[#0a0a0a] px-6 pb-6 pt-24"
    >
      <div
        id="graph-container"
        role="region"
        aria-label="Thought Graph"
        className="relative flex-1 min-h-[80vh] w-full rounded-[var(--radius-lg)] bg-[var(--background)] shadow-[var(--shadow-soft)]"
        style={{
          height: "calc(100vh - 4rem)",
          pointerEvents: "auto",
          zIndex: 0,
        }}
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
          className={`react-flow-subtle-cyan ${
            !hasAnimated ? "graph-fadein" : ""
          }`}
          nodes={rawNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onNodeDragStop={onNodeDragStop}
          onNodeContextMenu={onNodeContextMenu}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          fitView
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          nodeOrigin={[0.5, 0.5]}
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          selectionOnDrag
          minZoom={0.25}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          style={{ width: "100%", height: "100%", zIndex: 1 }}
          onInit={handleInit}
        >
          <Background color="rgba(47,243,255,0.08)" gap={20} size={1} />
          <MiniMap
            nodeColor={() => "#2ff3ff"}
            maskColor="rgba(10,15,18,0.85)"
            style={{ borderRadius: "8px", zIndex: 2 }}
          />
          <Controls
            showZoom
            showFitView
            showInteractive
            position="bottom-left"
            style={{
              color: "var(--accent)",
              zIndex: 3,
              pointerEvents: "auto",
            }}
          />
        </ReactFlow>
        {!graphLoadedOnce && isLoading && (
          <div className="loader-fadeout absolute inset-0 z-10 flex items-center justify-center bg-[var(--background)]/85 backdrop-blur-sm">
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
        {DEBUG_MODE && <RFDebugPanel rf={rf} nodesProvider={() => rawNodes} />}
      </div>
      {menuPos && contextNode && (
        <div
          className="fixed z-40 bg-filon-surface border border-filon-glow rounded p-xs text-sm shadow-glow animate-fade-in"
          style={{ left: menuPos.x, top: menuPos.y }}
        >
          <ContextMenu node={contextNode} closeMenu={closeContextMenu} />
        </div>
      )}
      <FeedbackToast />
      <SaveStatusBar />
      <MemoryPanel />
    </div>
  );
}

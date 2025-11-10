"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "reactflow";
import { motion } from "framer-motion";
import "reactflow/dist/style.css";
import clsx from "clsx";
import { useAutosave } from "@/hooks/useAutosave";
import { ReviewOverlay } from "@/components/ReviewOverlay";
import { MicroCoach } from "@/components/MicroCoach";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import Brainbar from "@/components/Brainbar";
import ContextStream, {
  type ContextStreamItem,
} from "@/components/ContextStream";
import { useBrainState } from "@/hooks/useBrainState";
import { useStreamState } from "@/hooks/useStreamState";
import type { BrainCommandType } from "@/types/brain";
import { useAutosaveState } from "@/hooks/useAutosaveState";
import { useShallow } from "zustand/react/shallow";
import { useNodeFeedback } from "@/hooks/useNodeFeedback";

declare global {
  interface Window {
    __forceOfflineTest?: boolean;
  }
}

type GraphCanvasProps = {
  sessionId?: string;
  initialThought?: string;
};

type GraphContextValue = {
  updateNodeNote: (nodeId: string, note: string) => void;
  createNode: (text: string, intent?: BrainCommandType) => Promise<void>;
};

export const GraphContext = createContext<GraphContextValue | null>(null);

const CanvasNode = ({ data }: NodeProps<NodeData>) => {
  const isActive = data?.active ?? false;
  const isHighlighted = data?.highlight ?? false;

  const animate = isActive
    ? {
        scale: [1, 1.02, 1],
        boxShadow: [
          "0 0 24px rgba(47,243,255,0.35)",
          "0 0 36px rgba(47,243,255,0.65)",
          "0 0 24px rgba(47,243,255,0.35)",
        ],
      }
    : {
        scale: 1,
        boxShadow: isHighlighted
          ? "0 0 28px rgba(47,243,255,0.45)"
          : "0 0 16px rgba(47,243,255,0.15)",
      };

  const transition = isActive
    ? {
        duration: 3.6,
        repeat: Infinity,
        ease: [0.45, 0, 0.55, 1] as const,
      }
    : {
        duration: 0.3,
      };

  return (
    <motion.div
      animate={animate}
      transition={transition}
      className={clsx(
        "min-w-[220px] rounded-[14px] border text-left shadow-xl transition-colors",
        isActive
          ? "border-brand/70 bg-linear-to-br from-brand/25 via-brand/10 to-[#0A0F12]"
          : isHighlighted
          ? "border-brand/40 bg-[#0A0F12]/85"
          : "border-cyan-400/15 bg-[#0A0F12]/70"
      )}
      style={{
        color: "#FFFFFF",
        textShadow: "0 0 8px rgba(47,243,255,0.3)",
        padding: "18px 22px",
        userSelect: "none",
        backdropFilter: "blur(10px)",
      }}
      data-intent={data.intent}
    >
      <div className="text-sm font-semibold leading-tight">
        {data?.label ?? "🌐 FILON Visible Node"}
      </div>
      <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.32em] text-brand/80">
        /{data.intent ?? "add"}
      </div>
    </motion.div>
  );
};

const nodeTypes = {
  default: CanvasNode,
};

type NodeData = {
  label: string;
  intent: BrainCommandType;
  active?: boolean;
  highlight?: boolean;
  isNew?: boolean;
  actualId?: string;
};

type GraphSnapshot = {
  nodes: Node<NodeData>[];
  edges: Edge[];
};

const STORAGE_KEY_PREFIX = "filon_autosave_graph";
const GRID_COLUMNS = 3;
const NODE_SPACING_X = 260;
const NODE_SPACING_Y = 190;

const STREAM_SUMMARY_MAP: Record<BrainCommandType, string> = {
  add: "Thought captured",
  link: "Connection logged",
  goal: "Goal captured",
  due: "Due date saved",
};

const gridPositionForIndex = (index: number) => {
  const column = index % GRID_COLUMNS;
  const row = Math.floor(index / GRID_COLUMNS);
  return {
    x: column * NODE_SPACING_X,
    y: row * NODE_SPACING_Y,
  };
};

export default function GraphCanvas({
  sessionId,
  initialThought,
}: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const nodeTypesMemo = useMemo(() => nodeTypes, []);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const {
    nodes: brainNodes,
    activeNodeId,
    setActiveNode,
    addNode,
    hydrated,
  } = useBrainState(
    useShallow((state) => ({
      nodes: state.nodes,
      activeNodeId: state.activeNodeId,
      setActiveNode: state.setActiveNode,
      addNode: state.addNode,
      hydrated: state.hydrated,
    }))
  );
  const streamEntries = useStreamState((state) => state.entries);
  const previousNodeCount = useRef(0);
  useNodeFeedback(nodes);

  const styledNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        style: node.data?.isNew
          ? {
              ...node.style,
              boxShadow: "0 0 14px rgba(47,243,255,0.8)",
              transform: "scale(1.04)",
              transition: "all 0.4s ease",
            }
          : node.style,
      })),
    [nodes]
  );
  useEffect(() => {
    if (!reactFlowRef.current) return;
    if (brainNodes.length === 0) return;

    if (previousNodeCount.current !== brainNodes.length) {
      previousNodeCount.current = brainNodes.length;
      reactFlowRef.current.fitView({ padding: 0.22, duration: 420 });
    }
  }, [brainNodes.length]);

  useEffect(() => {
    if (!reactFlowRef.current || !activeNodeId) return;
    const instance = reactFlowRef.current;
    const node = instance.getNode(activeNodeId);
    if (node?.positionAbsolute) {
      instance.setCenter(node.positionAbsolute.x, node.positionAbsolute.y, {
        duration: 380,
        zoom: 1.05,
      });
    }
  }, [activeNodeId]);

  const streamItems = useMemo<ContextStreamItem[]>(
    () =>
      streamEntries.map((entry) => ({
        id: entry.nodeId,
        title: entry.text,
        summary: STREAM_SUMMARY_MAP[entry.intent] ?? STREAM_SUMMARY_MAP.add,
        confidence: 95,
        ts: entry.createdAt,
      })),
    [streamEntries]
  );

  const handleStreamSelect = useCallback(
    (id: string) => {
      setActiveNode(id);
    },
    [setActiveNode]
  );

  const handleStreamHover = useCallback((id: string | null) => {
    setHoveredNodeId(id);
  }, []);

  const createNode = useCallback(
    async (text: string, intent: BrainCommandType = "add") => {
      const result = await addNode(text, intent, { sessionId });
      if (!result.ok) {
        throw new Error(result.error.message);
      }
    },
    [addNode, sessionId]
  );
  const graphApi = useMemo<GraphContextValue>(
    () => ({
      updateNodeNote: (_nodeId: string, _note: string) => {
        void _nodeId;
        void _note;
        // Step 21+ will attach autosave + feedback here.
      },
      createNode,
    }),
    [createNode]
  );
  const { pending, queue, commit, reject } = useReviewQueue<GraphSnapshot>();

  const sessionStorageKey = useMemo(
    () => `${STORAGE_KEY_PREFIX}:${sessionId ?? "offline-session"}`,
    [sessionId]
  );

  const graphSnapshot = useMemo<GraphSnapshot | null>(() => {
    if (!hydrated) {
      return null;
    }

    return {
      nodes,
      edges,
    };
  }, [edges, hydrated, nodes]);

  const saveGraph = useCallback(
    async (snapshot: GraphSnapshot) => {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(
          sessionStorageKey,
          JSON.stringify(snapshot)
        );
        if (window.__forceOfflineTest) {
          throw new Error("Offline mode forced");
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 400));
    },
    [sessionStorageKey]
  );

  const { status, triggerSave } = useAutosave(graphSnapshot, saveGraph);
  const setAutosaveStatus = useAutosaveState((state) => state.setStatus);

  const seededRef = useRef(false);

  useEffect(() => {
    if (!hydrated || seededRef.current) {
      return;
    }

    if (brainNodes.length === 0) {
      seededRef.current = true;
      void addNode(
        initialThought?.trim() && initialThought.trim().length > 0
          ? initialThought.trim()
          : "🌐 FILON Visible Node",
        "add",
        { sessionId }
      );
      return;
    }

    seededRef.current = true;
  }, [addNode, brainNodes.length, hydrated, initialThought, sessionId]);

  const normalizeGraphDetail = useCallback(
    (detail: Partial<GraphSnapshot>): GraphSnapshot => {
      const baseNodes = detail.nodes ?? nodes;
      const baseEdges = detail.edges ?? edges;

      const normalizedNodes = baseNodes.map((node, index) => {
        const label =
          node.data && typeof node.data.label === "string"
            ? node.data.label
            : "🌐 FILON Visible Node";
        const intent =
          node.data && typeof (node.data as NodeData).intent === "string"
            ? ((node.data as NodeData).intent as BrainCommandType)
            : "add";

        return {
          id: node.id ?? `node-${index}`,
          type: node.type ?? "default",
          position: node.position ?? gridPositionForIndex(index),
          data: {
            label,
            intent,
          },
        };
      });

      const fallbackNodeId = normalizedNodes[0]?.id ?? "node-0";
      const normalizedEdges = baseEdges.map((edge, index) => ({
        id: edge.id ?? `edge-${index}`,
        source: edge.source ?? fallbackNodeId,
        target: edge.target ?? fallbackNodeId,
        type: edge.type,
        data: edge.data,
      }));

      return {
        nodes: normalizedNodes,
        edges: normalizedEdges,
      };
    },
    [nodes, edges]
  );
  useEffect(() => {
    if (!hydrated) {
      return;
    }

    setNodes((prevNodes) =>
      brainNodes.map((brainNode, index) => {
        const previousNode = prevNodes.find((node) => node.id === brainNode.id);

        return {
          id: brainNode.id,
          type: "default",
          position: gridPositionForIndex(index),
          data: {
            label: brainNode.text,
            intent: brainNode.intent,
            active: brainNode.id === activeNodeId,
            highlight: hoveredNodeId === brainNode.id,
            isNew: previousNode?.data?.isNew ?? false,
            actualId: brainNode.id,
          },
        };
      })
    );
  }, [activeNodeId, brainNodes, hydrated, hoveredNodeId, setNodes]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleCreateNode = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          id?: string;
          label?: string;
          actualId?: string;
        }>
      ).detail;
      if (!detail) {
        return;
      }

      setNodes((prev) => {
        const newId = detail.id ?? `filon-node-${Date.now()}`;
        const actualId = detail.actualId ?? newId;

        const hasExisting = prev.some(
          (node) =>
            node.id === newId ||
            node.id === actualId ||
            node.data?.actualId === actualId
        );

        if (hasExisting) {
          return prev.map((node) =>
            node.id === newId || node.data?.actualId === actualId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    label:
                      detail.label ??
                      node.data?.label ??
                      "🌐 FILON Visible Node",
                    isNew: true,
                    actualId,
                  },
                }
              : node
          );
        }

        return [
          ...prev,
          {
            id: newId,
            type: "default",
            position: gridPositionForIndex(prev.length),
            data: {
              label: detail.label ?? "🌐 FILON Visible Node",
              intent: "add",
              active: false,
              highlight: false,
              isNew: true,
              actualId,
            },
          },
        ];
      });
    };

    window.addEventListener(
      "filon:create-node",
      handleCreateNode as EventListener
    );

    return () => {
      window.removeEventListener(
        "filon:create-node",
        handleCreateNode as EventListener
      );
    };
  }, [setNodes]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleGraphChange = (event: Event) => {
      const custom = event as CustomEvent<Partial<GraphSnapshot>>;
      const detail = custom.detail;

      if (!detail) {
        return;
      }

      const snapshot = normalizeGraphDetail(detail);
      queue(snapshot);
    };

    window.addEventListener("graphChange", handleGraphChange as EventListener);

    return () => {
      window.removeEventListener(
        "graphChange",
        handleGraphChange as EventListener
      );
    };
  }, [normalizeGraphDetail, queue]);

  const coachMessage = useMemo(() => {
    if (pending) {
      return "Tipp: Prüfe die Änderungen, bevor du sie übernimmst.";
    }
    if (status === "saved") {
      return "Änderung gespeichert ✓";
    }
    if (status === "error") {
      return "Speichern fehlgeschlagen – bitte erneut versuchen.";
    }
    if (status === "offline") {
      return "Du bist offline. Änderungen werden lokal zwischengespeichert.";
    }
    return null;
  }, [pending, status]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOffline = () => {
      setAutosaveStatus("offline", { source: "network-event" });
    };

    const handleOnline = () => {
      const currentStatus = useAutosaveState.getState().status;
      if (currentStatus === "offline") {
        setAutosaveStatus("idle", { source: "network-event" });
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    if (window.navigator.onLine === false) {
      setAutosaveStatus("offline", { source: "network-event", initial: true });
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [setAutosaveStatus]);

  const handleCommit = useCallback(() => {
    if (!pending) {
      return;
    }

    setNodes(pending.nodes);
    setEdges(pending.edges);
    commit();
  }, [pending, setNodes, setEdges, commit]);

  const handleRetry = useCallback(() => {
    triggerSave();
  }, [triggerSave]);

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#0A0F12]"
      data-session-id={sessionId ?? undefined}
    >
      <GraphContext.Provider value={graphApi}>
        <ReactFlowProvider>
          <div className="flex h-full flex-col">
            <div className="px-6 pt-6 pb-4">
              <Brainbar autoFocus />
            </div>
            <div className="relative flex-1 min-h-[320px] px-4 pb-4">
              <ReactFlow
                nodes={styledNodes}
                edges={edges}
                nodeTypes={nodeTypesMemo}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onInit={(instance) => {
                  reactFlowRef.current = instance;
                }}
                minZoom={0.4}
                maxZoom={2}
                fitView
                fitViewOptions={{ padding: 0.2, duration: 400 }}
                panOnScroll
                panOnDrag
                zoomOnScroll
                className="h-full rounded-3xl border border-cyan-400/10 bg-[#050708]/80 shadow-inner"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, #0A0F12 0%, #050708 100%)",
                }}
                data-testid="graph-flow-root"
              >
                <Background
                  id="filon-bg"
                  variant={BackgroundVariant.Dots}
                  gap={22}
                  size={1}
                  color="rgba(47,243,255,0.05)"
                />
                <MiniMap
                  className="z-20"
                  position="bottom-left"
                  maskColor="rgba(0, 0, 0, 0.2)"
                  pannable
                  zoomable
                  style={{
                    backgroundColor: "rgba(10, 15, 18, 0.65)",
                    border: "1px solid rgba(47, 243, 255, 0.3)",
                    borderRadius: "8px",
                    margin: "1rem",
                    width: 140,
                    height: 90,
                    boxShadow: "0 0 10px rgba(47,243,255,0.2)",
                  }}
                />
                <Controls className="z-20" position="bottom-left" />
              </ReactFlow>
            </div>
            <div className="px-6 pb-6">
              <ContextStream
                items={streamItems}
                onSelect={handleStreamSelect}
                hoveredId={hoveredNodeId ?? activeNodeId ?? undefined}
                onHover={handleStreamHover}
                position="bottom"
              />
            </div>
          </div>
        </ReactFlowProvider>
      </GraphContext.Provider>
      <OfflineIndicator />
      <MicroCoach message={coachMessage} />
      <ReviewOverlay
        visible={!!pending}
        status={status}
        onCommit={handleCommit}
        onReject={reject}
        onRetry={handleRetry}
      />
    </div>
  );
}

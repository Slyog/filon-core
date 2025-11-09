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
import { useAutosave } from "@/hooks/useAutosave";
import { FeedbackToast } from "@/components/FeedbackToast";
import { ReviewOverlay } from "@/components/ReviewOverlay";
import { MicroCoach } from "@/components/MicroCoach";
import { useReviewQueue } from "@/hooks/useReviewQueue";
import { OfflineIndicator } from "@/components/OfflineIndicator";

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
};

export const GraphContext = createContext<GraphContextValue | null>(null);

const CanvasNode = ({ data }: NodeProps<{ label: string }>) => (
  <motion.div
    animate={{
      scale: [1, 1.015, 1],
      boxShadow: [
        "0 0 20px rgba(47,243,255,0.3)",
        "0 0 30px rgba(47,243,255,0.6)",
        "0 0 20px rgba(47,243,255,0.3)",
      ],
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    style={{
      background: "linear-gradient(145deg, #00D4FF 0%, #0A0F12 100%)",
      border: "1.5px solid rgba(47, 243, 255, 0.6)",
      borderRadius: 14,
      color: "#FFFFFF",
      fontWeight: 600,
      textShadow: "0 0 8px #2FF3FF",
      padding: "14px 22px",
      userSelect: "none",
    }}
  >
    {data?.label ?? "🌐 FILON Visible Node"}
  </motion.div>
);

const nodeTypes = {
  default: CanvasNode,
};

type NodeData = {
  label: string;
};

type GraphSnapshot = {
  nodes: Node<NodeData>[];
  edges: Edge[];
};

const STORAGE_KEY_PREFIX = "filon_autosave_graph";

export default function GraphCanvas({
  sessionId,
  initialThought,
}: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const initialized = useRef(false);
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const nodeTypesMemo = useMemo(() => nodeTypes, []);
  const graphApi = useMemo<GraphContextValue>(
    () => ({
      updateNodeNote: (_nodeId: string, _note: string) => {
        // Step 21+ will attach autosave + feedback here.
      },
    }),
    []
  );
  const { pending, queue, commit, reject } = useReviewQueue<GraphSnapshot>();
  const [coachMessage, setCoachMessage] = useState<string | null>(null);

  const sessionStorageKey = useMemo(
    () => `${STORAGE_KEY_PREFIX}:${sessionId ?? "offline-session"}`,
    [sessionId]
  );

  const graphSnapshot = useMemo<GraphSnapshot | null>(() => {
    if (!initialized.current) {
      return null;
    }

    return {
      nodes,
      edges,
    };
  }, [nodes, edges]);

  const saveGraph = useCallback(
    async (snapshot: GraphSnapshot) => {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(sessionStorageKey, JSON.stringify(snapshot));
        if (window.__forceOfflineTest) {
          throw new Error("Offline mode forced");
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 400));
    },
    [sessionStorageKey]
  );

  const { status, triggerSave } = useAutosave(graphSnapshot, saveGraph);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    const label = initialThought?.trim() || "🌐 FILON Visible Node";
    setNodes([
      {
        id: "seed-1",
        type: "default",
        position: { x: 0, y: 0 },
        data: { label },
      },
    ]);

    const timeout = window.setTimeout(() => {
      reactFlowRef.current?.fitView({ padding: 0.2, duration: 400 });
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [initialThought, setNodes]);

  const normalizeGraphDetail = useCallback(
    (detail: Partial<GraphSnapshot>): GraphSnapshot => {
      const baseNodes = detail.nodes ?? nodes;
      const baseEdges = detail.edges ?? edges;

      const normalizedNodes = baseNodes.map((node, index) => {
        const label =
          node.data && typeof node.data.label === "string"
            ? node.data.label
            : "🌐 FILON Visible Node";

        return {
          id: node.id ?? `node-${index}`,
          type: node.type ?? "default",
          position: node.position ?? { x: index * 40, y: index * 24 },
          data: { label },
        };
      });

      const normalizedEdges = baseEdges.map((edge, index) => ({
        id: edge.id ?? `edge-${index}`,
        source: edge.source ?? "seed-1",
        target: edge.target ?? "seed-1",
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

  useEffect(() => {
    if (pending) {
      setCoachMessage("Tipp: Prüfe die Änderungen, bevor du sie übernimmst.");
    } else if (status === "success") {
      setCoachMessage("Änderung gespeichert ✓");
    } else {
      setCoachMessage(null);
    }
  }, [pending, status]);

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
      className="relative h-full w-full bg-[#0A0F12] overflow-hidden"
      data-session-id={sessionId ?? undefined}
    >
      <GraphContext.Provider value={graphApi}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
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
        </ReactFlowProvider>
      </GraphContext.Provider>
      <OfflineIndicator />
      <FeedbackToast status={status} />
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

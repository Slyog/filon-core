"use client";

import React, { createContext, useEffect, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { useAutosaveFeedback } from "../hooks/useAutosaveFeedback";
import { useSessionToast } from "../hooks/useSessionToast";
import { autosaveSnapshot } from "../utils/autosaveMock";

type GraphCanvasProps = {
  sessionId?: string;
  initialThought?: string;
};

type GraphContextValue = {
  updateNodeNote: (nodeId: string, note: string) => void;
};

export const GraphContext = createContext<GraphContextValue | null>(null);

const CanvasNode = ({ data }: NodeProps<{ label: string }>) => (
  <div
    style={{
      background: "linear-gradient(145deg, #00D4FF 0%, #0A0F12 100%)",
      border: "1.5px solid rgba(47, 243, 255, 0.6)",
      boxShadow: "0 0 30px rgba(47, 243, 255, 0.35)",
      borderRadius: 14,
      color: "#FFFFFF",
      fontWeight: 600,
      textShadow: "0 0 8px #2FF3FF",
      padding: "14px 22px",
      userSelect: "none",
    }}
  >
    {data?.label ?? "🌐 FILON Visible Node"}
  </div>
);

const nodeTypes = {
  default: CanvasNode,
};

export default function GraphCanvas({
  sessionId,
  initialThought,
}: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, _setEdges, onEdgesChange] = useEdgesState([]);
  const initialized = useRef(false);
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const nodeTypesMemo = useMemo(() => nodeTypes, []);
  const { markPending, markSaved } = useAutosaveFeedback();
  const { info: toastInfo, success: toastSuccess, error: toastError } =
    useSessionToast();
  const graphApi = useMemo<GraphContextValue>(
    () => ({
      updateNodeNote: (_nodeId: string, _note: string) => {
        // Step 21+ will attach autosave + feedback here.
      },
    }),
    []
  );

  useEffect(() => {
    if (!sessionId || nodes.length === 0) return;

    let isCancelled = false;

    markPending();
    toastInfo("Saving…");

    const persist = async () => {
      try {
        await autosaveSnapshot(sessionId, { nodes, edges });
        if (isCancelled) return;

        markSaved();
        toastSuccess("Saved ✓");

        if (process.env.NEXT_PUBLIC_QA_MODE === "true") {
          try {
            await fetch("/api/qa-log", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                event: "autosave",
                sessionId,
                nodes: nodes.length,
                edges: edges.length,
                time: new Date().toISOString(),
              }),
            });
          } catch (qaError) {
            console.warn("[autosave:qa-log]", qaError);
          }
        }
      } catch (error) {
        if (isCancelled) return;

        console.error("[autosave:error]", error);
        toastError("Autosave failed");
      }
    };

    void persist();

    return () => {
      isCancelled = true;
    };
  }, [
    sessionId,
    nodes,
    edges,
    markPending,
    markSaved,
    toastInfo,
    toastSuccess,
    toastError,
  ]);

  useEffect(() => {
    if (initialized.current) return;
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
            <MiniMap className="!z-20" />
            <Controls className="!z-20" position="bottom-left" />
          </ReactFlow>
        </ReactFlowProvider>
      </GraphContext.Provider>
    </div>
  );
}

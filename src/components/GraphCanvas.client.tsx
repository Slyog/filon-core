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
import "reactflow/dist/style.css";
import { useAutosaveFeedback } from "@/hooks/useAutosaveFeedback";
import { useSessionToast } from "@/hooks/useSessionToast";
import { autosaveSnapshot } from "@/utils/autosaveMock";
import { ReviewOverlay } from "@/components/ReviewOverlay";
import { MicroCoach } from "@/components/MicroCoach";

declare global {
  interface Window {
    __forceOfflineTest?: boolean;
    __qaRetryCounter?: number;
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

type NodeData = {
  label: string;
};

export default function GraphCanvas({
  sessionId,
  initialThought,
}: GraphCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, _setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const initialized = useRef(false);
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const nodeTypesMemo = useMemo(() => nodeTypes, []);
  const { markPending, markSaved, markError } = useAutosaveFeedback();
  const toast = useSessionToast();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );
  const [reviewMode, setReviewMode] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [offlineFlag, setOfflineFlag] = useState(false);
  const latestSnapshotRef = useRef<{ nodes: Node[]; edges: Edge[] }>({
    nodes,
    edges,
  });
  const idleHandleRef = useRef<number | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const [localStoreMessage, setLocalStoreMessage] = useState<string | null>(null);
  const graphApi = useMemo<GraphContextValue>(
    () => ({
      updateNodeNote: (_nodeId: string, _note: string) => {
        // Step 21+ will attach autosave + feedback here.
      },
    }),
    []
  );

  useEffect(() => {
    latestSnapshotRef.current = { nodes, edges };
  }, [nodes, edges]);

  const cancelIdleCallback = useCallback(
    (handle: number | null) => {
      if (handle === null || typeof window === "undefined") return;
      const win = window as typeof window & {
        cancelIdleCallback?: (handle: number) => void;
      };
      if (win.cancelIdleCallback) {
        win.cancelIdleCallback(handle);
      } else {
        window.clearTimeout(handle);
      }
    },
    []
  );

  const scheduleIdleCallback = useCallback((cb: () => void) => {
    if (typeof window === "undefined") return -1;
    const win = window as typeof window & {
      requestIdleCallback?: (
        cb: (deadline: unknown) => void,
        options?: unknown
      ) => number;
    };
    if (win.requestIdleCallback) {
      return win.requestIdleCallback(() => cb(), { timeout: 1200 });
    }
    return window.setTimeout(() => {
      cb();
    }, 16);
  }, []);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const resetScheduling = useCallback(() => {
    cancelIdleCallback(idleHandleRef.current);
    idleHandleRef.current = null;
    clearRetryTimer();
  }, [cancelIdleCallback, clearRetryTimer]);

  const performSave = useCallback(
    async (attempt: number) => {
      idleHandleRef.current = null;
      const snapshot = latestSnapshotRef.current;
      const targetSession = sessionId ?? "offline-session";

      const offlineForced =
        typeof window !== "undefined" && window.__forceOfflineTest === true;
      const randomFail =
        process.env.NODE_ENV !== "test" && Math.random() < 0.05;
      const shouldFail = offlineForced || randomFail;

      const isAutomatedTest =
        process.env.NODE_ENV === "test" ||
        (typeof navigator !== "undefined" && navigator.webdriver === true);
      if (isAutomatedTest) {
        console.info("[QA] Autosave triggered");
      }

      if (shouldFail) {
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            window.localStorage.setItem(
              `autosave:${targetSession}`,
              JSON.stringify(snapshot)
            );
            setLocalStoreMessage("Changes saved locally.");
          }
        } catch (storageError) {
          console.warn("[autosave:local]", storageError);
        }
        setOfflineFlag(true);
        setSaveStatus("error");
        markError("Network timeout");
        toast.error("Autosave failed – offline mode active");

        const nextAttempt = attempt + 1;
        setRetryCount(nextAttempt);
        if (typeof window !== "undefined") {
          window.__qaRetryCounter = nextAttempt;
        }
        if (process.env.NEXT_PUBLIC_QA_MODE === "true") {
          console.log(`[QA] Autosave retry attempt ${nextAttempt}`);
        }
        if (nextAttempt >= 3) {
          setLocalStoreMessage("Offline – changes stored locally.");
          if (process.env.NEXT_PUBLIC_QA_MODE === "true") {
            console.log("[QA] Autosave fallback stored locally after 3 retries");
          }
          return;
        }

        retryTimerRef.current = window.setTimeout(() => {
          setSaveStatus("saving");
          markPending();
          toast.info("Retrying save…");
          idleHandleRef.current = scheduleIdleCallback(() =>
            performSave(nextAttempt)
          );
        }, 2000);

        return;
      }

      try {
        await autosaveSnapshot(targetSession, snapshot);
        markSaved();
        setSaveStatus("success");
        setRetryCount(0);
        setOfflineFlag(false);
        setLocalStoreMessage(null);
        toast.success("Saved ✓");
        if (typeof window !== "undefined") {
          window.__qaRetryCounter = 0;
        }

        if (process.env.NEXT_PUBLIC_QA_MODE === "true") {
          console.log("[QA] Autosave event at", new Date().toISOString());
        }
      } catch (error) {
        console.error("[autosave:error]", error);
        setOfflineFlag(true);
        setSaveStatus("error");
        markError(
          error instanceof Error ? error.message : "Autosave failed unexpectedly"
        );
        toast.error("Autosave failed – offline mode active");

        const nextAttempt = attempt + 1;
        setRetryCount(nextAttempt);
        if (typeof window !== "undefined") {
          window.__qaRetryCounter = nextAttempt;
        }
        if (process.env.NEXT_PUBLIC_QA_MODE === "true") {
          console.log(`[QA] Autosave retry attempt ${nextAttempt}`);
        }
        if (nextAttempt >= 3) {
          setLocalStoreMessage("Offline – changes stored locally.");
          if (process.env.NEXT_PUBLIC_QA_MODE === "true") {
            console.log("[QA] Autosave fallback stored locally after 3 retries");
          }
          return;
        }

        retryTimerRef.current = window.setTimeout(() => {
          setSaveStatus("saving");
          markPending();
          toast.info("Retrying save…");
          idleHandleRef.current = scheduleIdleCallback(() =>
            performSave(nextAttempt)
          );
        }, 2000);
      }
    },
    [
      scheduleIdleCallback,
      markError,
      toast,
      markSaved,
      markPending,
      sessionId,
    ]
  );

  useEffect(() => {
    if (!initialized.current) return;
    if (nodes.length === 0) return;

    resetScheduling();
    markPending();
    setSaveStatus("saving");
    setReviewMode(false);
    setRetryCount(0);
    if (typeof window !== "undefined") {
      window.__qaRetryCounter = 0;
    }

    const handle = scheduleIdleCallback(() => performSave(0));
    idleHandleRef.current = handle;
    toast.info("Saving…");

    return () => {
      resetScheduling();
    };
  }, [
    nodes,
    edges,
    resetScheduling,
    markPending,
    scheduleIdleCallback,
    performSave,
    toast,
  ]);

  useEffect(() => {
    if (saveStatus === "success") {
      setReviewMode(true);
      const t = window.setTimeout(() => {
        setReviewMode(false);
        setSaveStatus("idle");
      }, 1800);
      return () => window.clearTimeout(t);
    }
    return;
  }, [saveStatus]);

  useEffect(() => {
    if (saveStatus === "error" && retryCount >= 3) {
      const t = window.setTimeout(() => {
        setSaveStatus("idle");
      }, 2400);
      return () => window.clearTimeout(t);
    }
    return;
  }, [retryCount, saveStatus]);

  useEffect(() => {
    return () => {
      resetScheduling();
    };
  }, [resetScheduling]);

  const coachMessage = useMemo(() => {
    if (offlineFlag && retryCount >= 3) {
      return "Offline – changes stored locally.";
    }
    if (offlineFlag) {
      return localStoreMessage ?? "You are offline; FILON will sync later.";
    }
    if (saveStatus === "success" && reviewMode) {
      return "Autosave verified.";
    }
    return null;
  }, [offlineFlag, retryCount, saveStatus, reviewMode, localStoreMessage]);

  useEffect(() => {
    if (!offlineFlag) {
      setLocalStoreMessage(null);
    }
  }, [offlineFlag]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const label = initialThought?.trim() || "🌐 FILON Visible Node";
    setNodes([
      {
        id: "seed-1",
        type: "default",
        position: { x: 0, y: 0 },
        data: { label } satisfies NodeData,
      } satisfies Node<NodeData>,
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
            <MiniMap
              className="!z-20"
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
              }}
            />
            <Controls className="!z-20" position="bottom-left" />
          </ReactFlow>
        </ReactFlowProvider>
      </GraphContext.Provider>
      <MicroCoach message={coachMessage} />
      <ReviewOverlay
        status={saveStatus}
        visible={reviewMode || saveStatus === "saving" || saveStatus === "error"}
      />
    </div>
  );
}

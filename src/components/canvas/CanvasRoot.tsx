"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReactFlowProvider, type ReactFlowInstance } from "reactflow";
import { FlowCanvas } from "./FlowCanvas";
import { EmptyWorkspacePanel } from "./EmptyWorkspacePanel";
import { useFlowStore, type FlowSnapshot } from "./useFlowStore";
import { useSimpleCanvasAutosave } from "@/hooks/useSimpleCanvasAutosave";
import { loadSimpleCanvasSnapshot } from "@/lib/simpleCanvasSession";
import type { OnboardingPresetId } from "@/components/onboarding/OnboardingPresetPanel";

type CanvasMode = "loading" | "onboarding" | "active";

type CanvasRootProps = {
  presetId?: OnboardingPresetId | null;
  onCreateGoalClick?: () => void;
  onAddTrackClick?: () => void;
};

export function CanvasRoot({ presetId, onCreateGoalClick, onAddTrackClick }: CanvasRootProps) {
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const storePresetId = useFlowStore((state) => state.presetId ?? null);
  const loadSnapshot = useFlowStore((state) => state.loadSnapshot);

  const [mode, setMode] = useState<CanvasMode>("loading");
  const [autosaveEnabled, setAutosaveEnabled] = useState(false);
  const hadSessionRef = useRef(false);
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);

  useEffect(() => {
    const snapshot = loadSimpleCanvasSnapshot();
    if (snapshot) {
      hadSessionRef.current = true;
      const flowSnapshot: FlowSnapshot = {
        version: 1,
        createdAt: Date.now(),
        workspaceId: null,
        nodes: snapshot.nodes,
        edges: snapshot.edges,
        presetId: snapshot.presetId ?? null,
      };
      loadSnapshot(flowSnapshot);
      setAutosaveEnabled(true);
      setMode("active");
    } else {
      hadSessionRef.current = false;
      setAutosaveEnabled(false);
      setMode("onboarding");
    }
  }, [loadSnapshot]);

  useSimpleCanvasAutosave({
    nodes,
    edges,
    presetId: storePresetId ?? presetId ?? null,
    enabled: autosaveEnabled,
  });

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstanceRef.current = instance;
    (window as any).__reactflow = instance;

    if (!hadSessionRef.current) {
      instance.fitView({ padding: 0.1, duration: 0 });
      const { zoom } = instance.getViewport();
      if (zoom < 0.8) {
        instance.zoomTo(0.8, { duration: 0 });
      }
    }
  }, []);

  const activateWorkspace = useCallback(() => {
    setAutosaveEnabled(true);
    setMode("active");
  }, []);

  const handleCreateGoal = useCallback(() => {
    onCreateGoalClick?.();
    activateWorkspace();
  }, [onCreateGoalClick, activateWorkspace]);

  const handleAddTrack = useCallback(() => {
    onAddTrackClick?.();
    activateWorkspace();
  }, [onAddTrackClick, activateWorkspace]);

  if (mode === "loading") {
    return <div className="w-full h-full bg-[#050509]" />;
  }

  return (
    <div className="relative w-full h-full min-h-0 min-w-0 overflow-hidden bg-[#050509]" data-id="canvas-host">
      <ReactFlowProvider>
        <FlowCanvas
          onInit={handleInit}
          presetId={presetId}
          onCreateGoalClick={onCreateGoalClick}
          onAddTrackClick={onAddTrackClick}
        />
      </ReactFlowProvider>

      {mode === "onboarding" && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#050509]/80 via-[#050509]/70 to-[#050509]/80">
          <EmptyWorkspacePanel onCreateGoalClick={handleCreateGoal} onAddTrackClick={handleAddTrack} />
        </div>
      )}
    </div>
  );
}


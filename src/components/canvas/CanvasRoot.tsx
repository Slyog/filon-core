"use client";

import { useState, useCallback } from "react";
import { ReactFlowProvider } from "reactflow";
import { FlowCanvas } from "./FlowCanvas";
import { AutosaveIndicator } from "./AutosaveIndicator";
import { RestoreToast } from "@/components/RestoreToast";
import { useFlowStore, type FlowSnapshot } from "./useFlowStore";
import { useCanvasAutosave } from "@/hooks/useCanvasAutosave";
import {
  hasDirtySession,
  clearCanvasSession,
  loadCanvasSession,
  markSessionClean,
} from "@/lib/session";
import type { OnboardingPresetId } from "@/components/onboarding/OnboardingPresetPanel";
import type { Node, Edge } from "reactflow";

type CanvasRootProps = {
  presetId?: OnboardingPresetId | null;
  onCreateGoalClick?: () => void;
  onAddTrackClick?: () => void;
};

export function CanvasRoot({ presetId, onCreateGoalClick, onAddTrackClick }: CanvasRootProps) {
  // Get canvas data for autosave status
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const presetFromStore = useFlowStore((state) => state.presetId);
  const loadSnapshot = useFlowStore((state) => state.loadSnapshot);
  const [showRestoreToast, setShowRestoreToast] = useState(() => {
    if (typeof window === "undefined") return false;
    return hasDirtySession();
  });
  
  // Get autosave status
  const { isSaving } = useCanvasAutosave({
    nodes,
    edges,
    presetId: presetFromStore ?? presetId ?? null,
  });

  const handleRestore = useCallback(() => {
    const session = loadCanvasSession();
    if (!session) {
      setShowRestoreToast(false);
      return;
    }

    const snapshot: FlowSnapshot = {
      version: 1,
      createdAt: Date.now(),
      workspaceId: null,
      nodes: session.nodes as Node[],
      edges: session.edges as Edge[],
      presetId: (session.presetId as OnboardingPresetId | null) ?? null,
    };

    loadSnapshot(snapshot);

    markSessionClean();
    setShowRestoreToast(false);
  }, [loadSnapshot]);

  const handleDiscard = useCallback(() => {
    // Clear the session when discarding to prevent toast from showing again
    clearCanvasSession();
    setShowRestoreToast(false);
  }, []);

  // Subtle grid pattern background
  const gridPattern = `data:image/svg+xml,${encodeURIComponent(`
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(26,26,26,0.3)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  `)}`;

  return (
    <div
      className="relative w-full h-full min-h-0 min-w-0 overflow-hidden bg-[#050509]"
      data-id="canvas-host"
    >
      {/* AUTOSAVE INDICATOR (minimal, high-contrast) */}
      <AutosaveIndicator isSaving={isSaving} />
      
      {/* RESTORE TOAST */}
      <div className="absolute bottom-6 right-6 z-[60]">
        <RestoreToast
          isVisible={showRestoreToast}
          onRestore={handleRestore}
          onDiscard={handleDiscard}
        />
      </div>
      
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("${gridPattern}")`,
        }}
      />
      <ReactFlowProvider>
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div
            data-id="rf-clip-2"
            className="absolute inset-0 w-full h-full overflow-hidden"
          >
            <FlowCanvas
              onInit={(instance) => ((window as any).__reactflow = instance)}
              presetId={presetId}
              onCreateGoalClick={onCreateGoalClick}
              onAddTrackClick={onAddTrackClick}
            />
          </div>
        </div>
      </ReactFlowProvider>
    </div>
  );
}

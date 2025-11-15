"use client";

import { useEffect, useState, useCallback } from "react";
import { ReactFlowProvider } from "reactflow";
import { FlowCanvas } from "./FlowCanvas";
import { AutosaveStatus } from "./AutosaveStatus";
import { RestoreToast } from "@/components/RestoreToast";
import { useFlowStore } from "./useFlowStore";
import { useCanvasAutosave } from "@/hooks/useCanvasAutosave";
import { hasDirtySession, clearCanvasSession } from "@/lib/session";
import type { OnboardingPresetId } from "@/components/onboarding/OnboardingPresetPanel";
import type { CanvasRestoreHandle } from "@/components/layout/AppFrame";

type CanvasRootProps = {
  presetId?: OnboardingPresetId | null;
  onCreateGoalClick?: () => void;
  onAddTrackClick?: () => void;
};

export function CanvasRoot({ presetId, onCreateGoalClick, onAddTrackClick }: CanvasRootProps) {
  // Get canvas data for autosave status
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const [showRestoreToast, setShowRestoreToast] = useState(false);
  
  // Get autosave status
  const { hasUnsavedChanges } = useCanvasAutosave({
    nodes,
    edges,
    presetId: presetId ?? null,
  });

  // Check for dirty (unsaved) session on mount and show toast if exists
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only show toast if there is a dirty (unsaved) session
    if (hasDirtySession()) {
      setShowRestoreToast(true);
    }
  }, []);

  const handleRestore = useCallback(() => {
    const restoreHandle = (window as any).__canvasRestore as CanvasRestoreHandle | undefined;
    if (restoreHandle) {
      const success = restoreHandle.restore();
      if (success) {
        // Clear the session after restore to prevent toast from showing again on reload
        clearCanvasSession();
        setShowRestoreToast(false);
      }
    }
  }, []);

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
      {/* AUTOSAVE STATUS INDICATOR */}
      <AutosaveStatus hasUnsavedChanges={hasUnsavedChanges} />
      
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

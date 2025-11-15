"use client";

import { ReactFlowProvider } from "reactflow";
import { FlowCanvas } from "./FlowCanvas";
import { AutosaveStatus } from "./AutosaveStatus";
import { useFlowStore } from "./useFlowStore";
import { useCanvasAutosave } from "@/hooks/useCanvasAutosave";
import type { OnboardingPresetId } from "@/components/onboarding/OnboardingPresetPanel";

type CanvasRootProps = {
  presetId?: OnboardingPresetId | null;
  onCreateGoalClick?: () => void;
  onAddTrackClick?: () => void;
};

export function CanvasRoot({ presetId, onCreateGoalClick, onAddTrackClick }: CanvasRootProps) {
  // Get canvas data for autosave status
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  
  // Get autosave status
  const { hasUnsavedChanges } = useCanvasAutosave({
    nodes,
    edges,
    presetId: presetId ?? null,
  });

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

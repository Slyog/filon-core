"use client";

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
  cloneElement,
  isValidElement,
} from "react";
import { Sidebar } from "./Sidebar";
import ContextStream from "./ContextStream";
import { Brainbar, type BrainbarHandle } from "./Brainbar";
import {
  OnboardingPresetPanel,
  type OnboardingPresetId,
} from "@/components/onboarding/OnboardingPresetPanel";
import { loadCanvasSession, hasCanvasSession, clearCanvasSession } from "@/lib/session";
import { useFlowStore } from "@/components/canvas/useFlowStore";
import type { FlowSnapshot } from "@/components/canvas/useFlowStore";
import { RestoreToast } from "@/components/RestoreToast";

const ONBOARDING_PRESET_STORAGE_KEY = "filon.v4.onboardingPreset";

export interface CanvasRestoreHandle {
  hasSavedState: () => boolean;
  restore: () => boolean;
}

function convertSessionToSnapshot(
  sessionState: ReturnType<typeof loadCanvasSession>
): FlowSnapshot | null {
  if (!sessionState) return null;

  return {
    version: 1,
    createdAt: sessionState.savedAt,
    workspaceId: null,
    nodes: sessionState.nodes as FlowSnapshot["nodes"],
    edges: sessionState.edges as FlowSnapshot["edges"],
    presetId: (sessionState.presetId as OnboardingPresetId | null) ?? null,
  };
}

type AppFrameProps = {
  children: ReactNode;
};

export default function AppFrame({ children }: AppFrameProps) {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<OnboardingPresetId | null>(null);
  const [showRestoreToast, setShowRestoreToast] = useState(false);
  const brainbarRef = useRef<BrainbarHandle | null>(null);
  const restoreHandleRef = useRef<CanvasRestoreHandle | null>(null);
  const loadSnapshot = useFlowStore((state) => state.loadSnapshot);

  // Initial restore check (optional - exposed for UI to call later)
  const checkForRestore = useCallback((): boolean => {
    if (!hasCanvasSession()) {
      return false;
    }

    const sessionState = loadCanvasSession();
    if (!sessionState) {
      return false;
    }

    const snapshot = convertSessionToSnapshot(sessionState);
    if (!snapshot) {
      return false;
    }

    try {
      loadSnapshot(snapshot);
      return true;
    } catch (error) {
      console.warn("[AppFrame] Failed to restore canvas state:", error);
      return false;
    }
  }, [loadSnapshot]);

  // Expose restore handle for UI to use later
  useEffect(() => {
    restoreHandleRef.current = {
      hasSavedState: () => hasCanvasSession(),
      restore: checkForRestore,
    };

    // Make available globally for later UI integration
    (window as any).__canvasRestore = restoreHandleRef.current;
  }, [checkForRestore]);

  // Check for saved canvas session on mount and show toast if exists
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check directly using hasCanvasSession - doesn't depend on restore handle
    if (hasCanvasSession()) {
      setShowRestoreToast(true);
    }
  }, []);

  const loadStoredPreset = (): OnboardingPresetId | null => {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem(ONBOARDING_PRESET_STORAGE_KEY);
    if (!value) return null;

    if (value === "career" || value === "health" || value === "deep_work" || value === "custom") {
      return value;
    }
    return null;
  };

  const storePreset = (presetId: OnboardingPresetId) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ONBOARDING_PRESET_STORAGE_KEY, presetId);
  };

  useEffect(() => {
    const storedPreset = loadStoredPreset();
    if (storedPreset) {
      // Synchronizing with external system (localStorage) - this is a valid use of useEffect
      setSelectedPreset(storedPreset);
      setShowOnboarding(false);
    }
  }, []);

  const handleOnboardingPresetSelect = (presetId: OnboardingPresetId) => {
    console.log("[Onboarding] preset selected:", presetId);
    setSelectedPreset(presetId);
    setShowOnboarding(false);
    storePreset(presetId);
  };

  const handleCreateGoalFromEmptyState = useCallback(() => {
    brainbarRef.current?.setValue("/goal ");
    brainbarRef.current?.focus();
  }, []);

  const handleAddTrackFromEmptyState = useCallback(() => {
    brainbarRef.current?.setValue("/link ");
    brainbarRef.current?.focus();
  }, []);

  const handleRestore = useCallback(() => {
    const restoreHandle = (window as any).__canvasRestore as CanvasRestoreHandle | undefined;
    if (restoreHandle) {
      const success = restoreHandle.restore();
      if (success) {
        setShowRestoreToast(false);
      }
    }
  }, []);

  const handleDiscard = useCallback(() => {
    clearCanvasSession();
    setShowRestoreToast(false);
  }, []);

  return (
    <div className="grid h-screen w-screen grid-cols-[280px_minmax(0,1fr)_340px] bg-filon-bg text-filon-text">
      {/* LEFT SIDEBAR */}
      <div className="col-span-1 col-start-1 h-full">
        <Sidebar />
      </div>

      {/* MAIN AREA */}
      <div className="relative col-span-1 col-start-2 flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-gradient-to-b from-filon-bg via-filon-bg to-[#050505] border-l border-filon-border/30 shadow-[inset_1px_0_0_rgba(0,0,0,0.6)]">
        <Brainbar ref={brainbarRef} />
        {showOnboarding && (
          <div className="mt-4 flex justify-center px-6">
            <OnboardingPresetPanel onSelectPreset={handleOnboardingPresetSelect} />
          </div>
        )}
        <main className="relative flex-1 min-h-0 min-w-0 overflow-hidden">
          {isValidElement(children)
            ? // Handlers only access refs when called (in event handlers), not during render
              // eslint-disable-next-line react-hooks/refs
              cloneElement(children, {
                presetId: selectedPreset,
                onCreateGoalClick: handleCreateGoalFromEmptyState,
                onAddTrackClick: handleAddTrackFromEmptyState,
              } as any)
            : children}
        </main>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="col-span-1 col-start-3 h-full border-l border-filon-border/60">
        <ContextStream />
      </div>

      {/* RESTORE TOAST */}
      <RestoreToast
        isVisible={showRestoreToast}
        onRestore={handleRestore}
        onDiscard={handleDiscard}
      />
    </div>
  );
}

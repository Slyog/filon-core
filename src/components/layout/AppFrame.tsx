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

const ONBOARDING_PRESET_STORAGE_KEY = "filon.v4.onboardingPreset";

type AppFrameProps = {
  children: ReactNode;
};

export default function AppFrame({ children }: AppFrameProps) {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<OnboardingPresetId | null>(null);
  const brainbarRef = useRef<BrainbarHandle | null>(null);

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
    </div>
  );
}

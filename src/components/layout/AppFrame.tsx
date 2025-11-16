"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  cloneElement,
  isValidElement,
} from "react";
import { Sidebar } from "./Sidebar";
import ContextStream from "./ContextStream";
import { Brainbar, type BrainbarHandle } from "@/components/brainbar/Brainbar";

type AppFrameProps = {
  children: ReactNode;
};

export default function AppFrame({ children }: AppFrameProps) {
  const brainbarRef = useRef<BrainbarHandle | null>(null);

  useEffect(() => {
    try {
      const flag = (process as any)?.env?.NEXT_PUBLIC_FILON_DEBUG_SESSION;
      if (flag === "true" && typeof window !== "undefined") {
        (window as any).__FILON_SESSION_DEBUG__ = true;
        // eslint-disable-next-line no-console
        console.log("[SessionDebug] enabled via NEXT_PUBLIC_FILON_DEBUG_SESSION");
      }
    } catch {
      // ignore
    }
  }, []);

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
      <div className="col-span-1 col-start-1 h-full">
        <Sidebar />
      </div>

      <div className="relative col-span-1 col-start-2 flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-gradient-to-b from-filon-bg via-filon-bg to-[#050505] border-l border-filon-border/30 shadow-[inset_1px_0_0_rgba(0,0,0,0.6)]">
        <div className="relative w-full h-[64px] px-4 pt-2 pb-1 z-50">
          <Brainbar ref={brainbarRef} />
        </div>

        <main className="relative flex-1 min-h-0 min-w-0 overflow-hidden pt-[88px]">
          {isValidElement(children)
            ? cloneElement(children, {
                onCreateGoalClick: handleCreateGoalFromEmptyState,
                onAddTrackClick: handleAddTrackFromEmptyState,
              } as any)
            : children}
        </main>
      </div>

      <div className="col-span-1 col-start-3 h-full border-l border-filon-border/60">
        <ContextStream />
      </div>
    </div>
  );
}

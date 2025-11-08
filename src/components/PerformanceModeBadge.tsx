"use client";

import { useRuntimeFlags } from "@/hooks/useRuntimeFlags";

/**
 * FILON Step 16.2 - Performance Mode Badge
 * Shows when motion or audio is disabled
 */
export default function PerformanceModeBadge() {
  const { motionEnabled, soundEnabled } = useRuntimeFlags();

  // Hide badge when both flags are enabled
  if (motionEnabled && soundEnabled) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-3 right-3 z-50 rounded-lg bg-zinc-900/90 backdrop-blur-sm border border-zinc-700/50 px-3 py-1.5 text-xs text-zinc-400 opacity-70 pointer-events-none"
      style={{
        position: "fixed",
        bottom: "12px",
        right: "12px",
        opacity: 0.7,
        fontSize: "0.75rem",
      }}
    >
      ⚙️ Performance Mode – Visual + Audio disabled
    </div>
  );
}


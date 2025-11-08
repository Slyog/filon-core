"use client";
import { useFeedbackStore } from "@/store/FeedbackStore";

export default function SaveStatusBar() {
  const events = useFeedbackStore((s) => s.events);
  // Get the most recent sync event
  const lastSyncEvent = events
    .filter((e) => e.type === "sync_success" || e.type === "sync_failed")
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  const status = lastSyncEvent
    ? lastSyncEvent.type === "sync_success"
      ? "synced"
      : "disconnected"
    : "idle";

  const colors = {
    idle: "text-gray-400",
    saving: "text-yellow-400 animate-pulse",
    synced: "text-cyan-400",
    disconnected: "text-red-400",
  };

  const text = {
    idle: "Idle",
    saving: "Saving...",
    synced: `Synced (${new Date(
      lastSyncEvent?.timestamp || 0
    ).toLocaleTimeString()})`,
    disconnected: "No connection (local only)",
  };

  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 text-sm font-medium z-50">
      <span className={colors[status as keyof typeof colors]}>
        {text[status as keyof typeof text]}
      </span>
    </div>
  );
}

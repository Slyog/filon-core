"use client";
import { useFeedbackStore } from "@/store/FeedbackStore";

export default function SaveStatusBar() {
  const { status, lastSync } = useFeedbackStore();

  const colors = {
    idle: "text-gray-400",
    saving: "text-yellow-400 animate-pulse",
    synced: "text-cyan-400",
    offline: "text-red-400",
  };

  const text = {
    idle: "Idle",
    saving: "Saving...",
    synced: `Synced (${new Date(lastSync || 0).toLocaleTimeString()})`,
    offline: "Offline (local only)",
  };

  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 text-sm font-medium z-50">
      <span className={colors[status]}>{text[status]}</span>
    </div>
  );
}

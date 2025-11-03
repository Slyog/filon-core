"use client";
import { useMemoryStore } from "@/store/MemoryStore";

export default function MemoryPanel() {
  const { history, getTrend } = useMemoryStore();
  if (!history.length) return null;
  return (
    <div className="fixed bottom-16 right-4 text-xs text-[var(--foreground)] opacity-60">
      Letzte Sessions: {history.length}
      <br />
      Letzter Trend: {getTrend()}
    </div>
  );
}

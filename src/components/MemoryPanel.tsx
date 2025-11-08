"use client";
import { useMemoryStore } from "@/store/MemoryStore";
import { Panel } from "@/components/Panel";
import { t } from "@/config/strings";

export default function MemoryPanel() {
  const history = useMemoryStore((s) => s.memoryHistory);
  const getTrend = useMemoryStore((s) => s.getTrend);

  return (
    <Panel id="memory">
      <div className="space-y-2 text-sm text-text-secondary">
        <div className="font-semibold text-text-primary">{t.lastSessions}: {history.length}</div>
        <div className="space-y-1">
          {history.slice(0, 5).map((entry) => (
            <div key={entry.id} className="rounded-lg bg-surface-hover/40 px-3 py-2">
              <div className="text-xs uppercase tracking-wide text-text-muted">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </div>
              <div className="text-sm text-text-primary">{entry.summary}</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-text-muted">{t.lastTrend}: {getTrend()}</div>
      </div>
    </Panel>
  );
}

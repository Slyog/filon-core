"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface ContextStreamItem {
  id: string;
  title: string;
  summary: string;
  type: "insight" | "summary" | "signal" | "reference";
  confidence?: number;
  source?: string;
  timestamp: number;
}

interface ContextStreamProps {
  items?: ContextStreamItem[];
  onSelect?: (id: string) => void;
  className?: string;
}

const defaultContext: ContextStreamItem[] = [
  {
    id: "ctx-1",
    title: "Graph canvas stable for v4",
    summary:
      "ReactFlow shell is locked. Focus remaining polish on Sidebar lists and Context Stream readability.",
    type: "insight",
    confidence: 0.82,
    timestamp: Date.now() - 1000 * 60 * 2,
    source: "Systems",
  },
  {
    id: "ctx-2",
    title: "Brainbar copy verified",
    summary:
      "Latest writing pass keeps commands actionable. Only highlight is accent restraint on hover/focus.",
    type: "summary",
    confidence: 0.74,
    timestamp: Date.now() - 1000 * 60 * 8,
    source: "Brainbar QA",
  },
  {
    id: "ctx-3",
    title: "Context Stream cards",
    summary:
      "Need tactile hover state plus grayscale badges. Timestamp should stay compact (e.g., 5m ago).",
    type: "signal",
    timestamp: Date.now() - 1000 * 60 * 25,
    source: "Design Pass",
  },
];

export default function ContextStream({
  items,
  onSelect,
  className,
}: ContextStreamProps) {
  const streamItems = items && items.length > 0 ? items : defaultContext;

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col bg-filon-surface/80 text-filon-text backdrop-blur-sm supports-[backdrop-filter]:bg-filon-surface/70",
        className
      )}
    >
      <div className="border-b border-filon-border/60 px-6 py-4">
        <p className="text-[11px] uppercase tracking-[0.35em] text-filon-text/50">
          Context Stream
        </p>
        <p className="mt-2 text-sm text-filon-text/60">
          Latest signals, summaries, and references for this workspace.
        </p>
      </div>

      <ScrollArea className="flex-1 px-6 pb-6">
        <div className="flex flex-col gap-4 py-5 pr-2">
          {streamItems.map((item) => (
            <article
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect?.(item.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect?.(item.id);
                }
              }}
              className="rounded-2xl border border-filon-border/70 bg-filon-bg/40 p-4 shadow-[0_0_35px_rgba(0,0,0,0.35)] transition hover:border-filon-accent/40 hover:shadow-[0_0_30px_rgba(47,243,255,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-filon-accent/70"
            >
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-filon-text/45">
                <span>{item.type}</span>
                <span>{formatRelativeTime(item.timestamp)}</span>
              </div>

              <h3 className="mt-3 text-sm font-semibold text-filon-text">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-filon-text/70">
                {item.summary}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-filon-text/60">
                {typeof item.confidence === "number" && (
                  <span className="rounded-full border border-filon-border/70 px-3 py-1">
                    {Math.round(item.confidence * 100)}% confidence
                  </span>
                )}
                {item.source && (
                  <span className="rounded-full border border-filon-border/60 px-3 py-1 text-filon-text/55">
                    {item.source}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const minutes = Math.max(Math.floor(diff / 60000), 0);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

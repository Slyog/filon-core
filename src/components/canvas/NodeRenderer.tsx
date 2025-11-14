"use client";

import type { NodeProps } from "reactflow";

export const nodeTypes = {
  default: ({ data }: NodeProps<{ label?: string }>) => (
    <div
      className="p-3 rounded-lg border border-filon-border bg-filon-surface text-filon-text text-sm shadow-sm min-w-[120px] hover:border-filon-accent transition-colors"
      role="button"
      tabIndex={0}
      aria-label={data.label || "Node"}
    >
      {data.label || "Node"}
    </div>
  ),
  goal: ({ data }: NodeProps<{ label?: string }>) => (
    <div
      className="p-3 rounded-lg border-2 border-filon-accent bg-filon-bg text-filon-accent text-sm shadow-sm shadow-filon-glow min-w-[120px] font-semibold hover:shadow-[0_0_12px_var(--filon-glow)] transition-shadow"
      role="button"
      tabIndex={0}
      aria-label={`Goal: ${data.label || "Untitled"}`}
    >
      {data.label || "Goal"}
    </div>
  ),
  track: ({ data }: NodeProps<{ label?: string }>) => (
    <div
      className="p-3 rounded-lg border border-filon-border bg-filon-surface/80 text-filon-text text-sm shadow-sm min-w-[120px] hover:bg-filon-surface transition-colors"
      role="button"
      tabIndex={0}
      aria-label={`Track: ${data.label || "Untitled"}`}
    >
      {data.label || "Track"}
    </div>
  ),
};

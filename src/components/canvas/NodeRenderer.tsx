"use client";

import type { NodeProps } from "reactflow";

export const nodeTypes = {
  default: ({ data }: NodeProps<{ label?: string }>) => (
    <div
      className="px-4 py-3 rounded-filon border border-filon-border/60 bg-filon-bg/90 text-filon-text text-sm font-semibold leading-snug min-w-[120px] cursor-pointer transition-colors transition-shadow duration-150 ease-out hover:border-filon-accent/70 hover:bg-filon-bg hover:shadow-[0_0_18px_rgba(47,243,255,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-filon-accent/80 focus-visible:ring-offset-0"
      role="button"
      tabIndex={0}
      aria-label={data.label || "Node"}
    >
      {data.label || "Node"}
    </div>
  ),
  goal: ({ data }: NodeProps<{ label?: string }>) => (
    <div
      className="px-4 py-3 rounded-filon border border-filon-accent/70 bg-filon-bg/90 text-filon-text text-sm font-semibold leading-snug min-w-[120px] cursor-pointer transition-colors transition-shadow duration-150 ease-out hover:border-filon-accent/70 hover:bg-filon-bg hover:shadow-[0_0_18px_rgba(47,243,255,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-filon-accent/80 focus-visible:ring-offset-0"
      role="button"
      tabIndex={0}
      aria-label={`Goal: ${data.label || "Untitled"}`}
    >
      <span className="text-filon-accent">{data.label || "Goal"}</span>
    </div>
  ),
  track: ({ data }: NodeProps<{ label?: string }>) => (
    <div
      className="px-4 py-3 rounded-filon border border-filon-border/60 bg-filon-bg/90 text-filon-text text-sm font-semibold leading-snug min-w-[120px] cursor-pointer transition-colors transition-shadow duration-150 ease-out hover:border-filon-accent/70 hover:bg-filon-bg hover:shadow-[0_0_18px_rgba(47,243,255,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-filon-accent/80 focus-visible:ring-offset-0"
      role="button"
      tabIndex={0}
      aria-label={`Track: ${data.label || "Untitled"}`}
    >
      {data.label || "Track"}
    </div>
  ),
};

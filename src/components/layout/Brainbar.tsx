"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";

const quickChips = [
  "Outline next step",
  "Summarize latest insight",
  "Link related track",
  "Add supporting reference",
];

export function Brainbar() {
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-filon-border/70 bg-filon-bg/95 px-6 py-4 backdrop-blur-sm supports-[backdrop-filter]:bg-filon-bg/80">
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Brainbar"
        className="flex flex-col gap-3"
      >
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-filon-text/50">
          <span>Brainbar</span>
          <span className="text-filon-text/40">Shift + Enter to link</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-filon-text/40" />
            <Input
              placeholder="Capture a thought, goal, or link..."
              aria-label="Brainbar input"
              className="h-11 rounded-xl border border-filon-border/70 bg-filon-surface/70 pl-11 pr-16 text-base text-filon-text placeholder:text-filon-text/45 focus-visible:border-filon-accent/70 focus-visible:ring-2 focus-visible:ring-filon-accent/70"
            />
            <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-filon-border/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-filon-text/60">
              Enter
            </kbd>
          </div>

          <button
            type="submit"
            className="flex h-11 min-w-[140px] items-center justify-center gap-2 rounded-xl border border-filon-accent/40 bg-filon-accent/10 px-4 text-sm font-semibold text-filon-text transition hover:bg-filon-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-filon-accent/80 focus-visible:ring-offset-0"
          >
            <Sparkles className="h-4 w-4 text-filon-accent" />
            Commit Thought
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickChips.map((chip) => (
            <button
              key={chip}
              type="button"
              className="rounded-full border border-filon-border/80 px-3 py-1 text-xs text-filon-text/65 transition hover:border-filon-accent/60 hover:text-filon-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-filon-accent/70"
            >
              {chip}
            </button>
          ))}
        </div>
      </form>
    </header>
  );
}

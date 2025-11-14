"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Brainbar() {
  return (
    <header
      className="sticky top-0 z-50 h-14 flex items-center px-4 bg-filon-surface border-b border-filon-border backdrop-blur-sm"
      role="banner"
      aria-label="Brain bar - Command input"
    >
      <Input
        placeholder="Add a thought, command, or query..."
        className="flex-1 bg-transparent border-filon-border text-filon-text placeholder:text-filon-text/50 focus-visible:ring-filon-accent focus-visible:border-filon-accent"
        role="searchbox"
        aria-label="Command input"
      />
    </header>
  );
}

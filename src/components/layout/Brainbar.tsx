"use client";

import { Input } from "@/components/ui/input";

export function Brainbar() {
  return (
    <div className="h-14 flex items-center px-4 bg-filon-surface border-b border-filon-border">
      <Input placeholder="Add a thought, command, or query..." />
    </div>
  );
}


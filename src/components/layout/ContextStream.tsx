"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function ContextStream() {
  return (
    <div className="h-full bg-filon-surface text-black p-4 border-l border-filon-border flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Context Stream</h2>
      <Separator className="mb-4" />

      <ScrollArea className="flex-1 pr-2">
        <div className="text-sm opacity-75">
          Context insights will appear here.
        </div>
      </ScrollArea>
    </div>
  );
}


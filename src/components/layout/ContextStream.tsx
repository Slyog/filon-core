"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface ContextStreamItem {
  id: string;
  title: string;
  summary: string;
  confidence: number;
  ts: number;
}

interface ContextStreamProps {
  items?: ContextStreamItem[];
  onSelect?: (id: string) => void;
  position?: "card" | "bottom";
  className?: string;
}

export default function ContextStream({
  items,
  onSelect,
  position = "card",
  className,
}: ContextStreamProps) {
  return (
    <aside
      className={cn(
        "w-full h-full overflow-hidden flex flex-col bg-filon-surface",
        className
      )}
    >
      <div className="p-4 font-semibold text-filon-text">
        Context
      </div>
      <Separator />
      <ScrollArea className="flex-1 p-4">
        <div className="text-sm text-filon-text-secondary">
          Context insights will appear here.
        </div>
      </ScrollArea>
    </aside>
  );
}

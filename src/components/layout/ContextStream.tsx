"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
}

export function ContextStream({ items, onSelect, position }: ContextStreamProps) {
  return (
    <div className="h-full bg-filon-surface text-filon-text p-4 border-l border-filon-border flex flex-col">
      <h2 className="text-lg font-semibold mb-4">Context Stream</h2>
      <Separator className="mb-4" />

      <ScrollArea className="flex-1 pr-2">
        {items && items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="text-sm p-2 rounded border border-filon-border bg-filon-bg/50 hover:bg-filon-bg cursor-pointer"
                onClick={() => onSelect?.(item.id)}
              >
                <div className="font-medium">{item.title}</div>
                {item.summary && (
                  <div className="text-xs opacity-75 mt-1">{item.summary}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm opacity-75">
            Context insights will appear here.
          </div>
        )}
      </ScrollArea>
    </div>
  );
}


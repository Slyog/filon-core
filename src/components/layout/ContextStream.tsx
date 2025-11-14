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

export function ContextStream({
  items,
  onSelect,
  position,
  className,
}: ContextStreamProps) {
  return (
    <aside
      className={cn(
        "col-start-3 col-span-1 h-full w-[320px] border-l border-filon-border bg-filon-surface text-filon-text flex flex-col overflow-hidden relative z-10",
        className
      )}
      role="complementary"
      aria-label="Context stream"
    >
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-sm font-semibold text-filon-text">Context</h2>
        <Separator className="mt-3 bg-filon-border" />
      </div>

      <div className="px-4 pb-4 [height:calc(100%-88px)]">
        <ScrollArea className="h-full overflow-y-auto pr-2">
          {items && items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  className={cn(
                    "w-full rounded border border-filon-border bg-filon-bg/40 p-2 text-left text-xs transition-colors",
                    "hover:bg-filon-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-filon-accent focus-visible:ring-offset-2 focus-visible:ring-offset-filon-surface"
                  )}
                  onClick={() => onSelect?.(item.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select context: ${item.title}`}
                >
                  <div className="font-medium text-filon-text">{item.title}</div>
                  {item.summary && (
                    <div className="mt-1 text-[11px] text-filon-text/70 line-clamp-2">
                      {item.summary}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-filon-text/50">
              Context insights will appear here.
            </div>
          )}
        </ScrollArea>
      </div>
    </aside>
  );
}

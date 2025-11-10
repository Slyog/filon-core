"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useAutoFocusScroll } from "@/hooks/useAutoFocusScroll";
import { useThrottledCallback } from "@/hooks/useThrottledCallback";
import { t } from "@/config/strings";
import { useContextStream } from "@/hooks/useContextStream";

export interface ContextStreamItem {
  id: string;
  title: string;
  summary: string;
  confidence: number;
  ts: number;
}

interface ContextStreamProps {
  items: ContextStreamItem[];
  onSelect: (id: string) => void;
  hoveredId?: string;
  onHover?: (id: string | null) => void;
  position?: "card" | "bottom";
}

const List = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => <div ref={ref} role="list" {...props} />);
List.displayName = "ContextStreamList";

const relativeTime = (timestamp: number) => {
  const delta = Date.now() - timestamp;
  const minutes = Math.round(delta / 60000);
  if (minutes < 1) return t.justNow;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
};

const confidenceTone = (confidence: number) => {
  if (confidence >= 90) return "text-emerald-300 bg-emerald-500/20";
  if (confidence >= 80) return "text-amber-200 bg-amber-500/20";
  return "text-rose-200 bg-rose-500/20";
};

interface RowProps {
  item: ContextStreamItem;
  index: number;
  active: boolean;
  highlighted: boolean;
  onHover?: (id: string | null) => void;
  onPress: (id: string) => void;
  onFocus: (index: number) => void;
  total: number;
}

const StreamRow = React.memo(
  ({
    item,
    index,
    active,
    highlighted,
    onHover,
    onPress,
    onFocus,
    total,
  }: RowProps) => {
    const ref = useRef<HTMLDivElement>(null);
    useAutoFocusScroll(ref as React.RefObject<HTMLElement>, active);

    const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (
      event
    ) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = Math.min(total - 1, index + 1);
        onFocus(next);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        const prev = Math.max(0, index - 1);
        onFocus(prev);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        onPress(item.id);
      }
    };

    return (
      <motion.div
        ref={ref}
        role="listitem"
        tabIndex={0}
        data-focused={active}
        data-testid={`context-row-${item.id}`}
        className={clsx(
          "focus-glow flex flex-col gap-1 rounded-xl border border-cyan-400/10 bg-surface-active/30 p-3 transition-colors focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base",
          highlighted && "border-cyan-400/50 bg-cyan-500/10",
          active && "ring-1 ring-cyan-300/60"
        )}
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: [0.25, 0.8, 0.4, 1] }}
        layout
        onFocus={() => onFocus(index)}
        onMouseEnter={() => onHover?.(item.id)}
        onMouseLeave={() => onHover?.(null)}
        onKeyDown={handleKeyDown}
        onClick={() => onPress(item.id)}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-normal text-text-primary line-clamp-1">
            {item.title}
          </p>
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              confidenceTone(item.confidence)
            )}
          >
            {Math.round(item.confidence)}%
          </span>
        </div>
        <p
          className="text-xs font-light text-text-secondary/90"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.summary}
        </p>
        <div className="flex items-center justify-between text-[11px] text-text-secondary/70">
          <span>{relativeTime(item.ts)}</span>
          <span>{t.selectWithEnter}</span>
        </div>
      </motion.div>
    );
  }
);

StreamRow.displayName = "StreamRow";

const ContextStream = ({
  items,
  onSelect,
  hoveredId,
  onHover,
  position = "card",
}: ContextStreamProps) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  const announceSelection = useCallback(
    (id: string) => {
      const item = items.find((entry) => entry.id === id);
      if (!item) return;
      setAnnouncement(t.selected.replace("{title}", item.title));
      onSelect(id);
    },
    [items, onSelect]
  );

  const data = useMemo(() => items, [items]);
  const throttledHover = useThrottledCallback((id: string | null) => {
    onHover?.(id ?? null);
  });

  useEffect(() => {
    if (!hoveredId) return;
    const idx = items.findIndex((item) => item.id === hoveredId);
    if (idx >= 0 && idx !== activeIndex) {
      const frame = requestAnimationFrame(() => setActiveIndex(idx));
      return () => cancelAnimationFrame(frame);
    }
  }, [hoveredId, items, activeIndex]);

  useEffect(() => {
    if (items.length === 0) {
      const frame = requestAnimationFrame(() => setActiveIndex(0));
      return () => cancelAnimationFrame(frame);
      return;
    }
    if (activeIndex >= items.length) {
      const frame = requestAnimationFrame(() =>
        setActiveIndex(items.length - 1)
      );
      return () => cancelAnimationFrame(frame);
    }
  }, [items, activeIndex]);

  const containerClass = clsx(
    "transition-colors",
    position === "bottom"
      ? "w-full rounded-2xl border border-cyan-400/18 bg-surface-active/70 px-4 py-4 backdrop-blur-sm md:px-6 md:py-5"
      : "rounded-3xl border border-cyan-400/15 bg-surface-hover/30 p-4 backdrop-blur-xl"
  );

  return (
    <motion.section
      data-tour-id="tour-context"
      role="region"
      aria-label="Context Stream"
      className={containerClass}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14, ease: [0.25, 0.8, 0.4, 1] }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-normal uppercase tracking-[0.3em] text-cyan-200">
          {t.contextStream}
        </h2>
        <span className="text-xs font-light text-text-secondary/80">
          {items.length} {t.entries}
        </span>
      </div>
      {items.length > 0 ? (
        <Virtuoso
          ref={virtuosoRef}
          data={data}
          className={clsx(
            position === "bottom" ? "max-h-[260px]" : "max-h-[360px]"
          )}
          style={{ height: position === "bottom" ? 260 : 360 }}
          components={{ List }}
          defaultItemHeight={96}
          overscan={6}
          increaseViewportBy={{ top: 120, bottom: 240 }}
          itemContent={(index, item) => (
            <div className="mb-2">
              <StreamRow
                item={item}
                index={index}
                total={data.length}
                active={index === activeIndex}
                highlighted={hoveredId === item.id}
                onHover={throttledHover}
                onPress={announceSelection}
                onFocus={setActiveIndex}
              />
            </div>
          )}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.25, 0.8, 0.4, 1] }}
          className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-cyan-400/20 bg-surface-hover/30 text-center text-xs text-text-secondary/70"
        >
          <span className="font-medium text-text-secondary/80">
            {t.noContextEntries}
          </span>
          <span className="mt-1 text-text-secondary/60">
            {t.captureThoughtHint}
          </span>
        </motion.div>
      )}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </motion.section>
  );
};

export default React.memo(ContextStream);

export function ContextStreamPanel() {
  const entries = useContextStream();

  return (
    <div className="mt-4 max-h-80 overflow-y-auto rounded-xl border border-cyan-300/20 bg-neutral-900/40 p-4 text-sm">
      <h2 className="mb-2 text-cyan-300 font-semibold">Context Stream</h2>
      {entries.length === 0 && (
        <p className="text-neutral-500 text-xs">No activity yet.</p>
      )}
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="mb-2 border-b border-neutral-800/40 pb-1 last:border-0"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-neutral-100">{entry.title}</span>
            <span className="text-xs text-neutral-500">{entry.time}</span>
          </div>
          {entry.detail && (
            <p className="text-xs text-neutral-400">{entry.detail}</p>
          )}
        </div>
      ))}
    </div>
  );
}

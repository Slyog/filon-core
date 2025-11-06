"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect, memo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Node, Edge } from "reactflow";
import { Sparkles, Pin, Filter, Info } from "lucide-react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { useFeedbackStore, type FeedbackEvent } from "@/store/FeedbackStore";
import { useActiveNode } from "@/context/ActiveNodeContext";
import ExplainOverlay from "@/components/ExplainOverlay";
import localforage from "localforage";

type FilterMode = "all" | "ai" | "events";

const PINNED_EVENTS_KEY = "filon-pinned-events";

interface GraphContextStreamProps {
  activeNode?: Node | null;
  nodes?: Node[];
  edges?: Edge[];
  onNodeSelect?: (nodeId: string) => void;
}

interface StreamEvent {
  id: string;
  type: FeedbackEvent["type"];
  message: string;
  timestamp: number;
  nodeId: string | null;
  isPinned?: boolean;
}

function toStreamEvent(event: FeedbackEvent): StreamEvent {
  const payload = event.payload as
    | { message?: string; nodeId?: string; summary?: string; confidence?: number }
    | undefined;

  const message =
    event.message ??
    payload?.message ??
    payload?.summary ??
    (typeof event.payload === "string"
      ? event.payload
      : JSON.stringify(event.payload ?? {}));

  const nodeId =
    event.nodeId ??
    (typeof payload?.nodeId === "string" ? payload.nodeId : null);

  return {
    id: event.id,
    type: event.type,
    message,
    timestamp: event.timestamp,
    nodeId,
  };
}

export default function GraphContextStream({
  activeNode,
  nodes = [],
  onNodeSelect,
}: GraphContextStreamProps) {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [showExplain, setShowExplain] = useState<boolean>(false);
  const [pinnedEventIds, setPinnedEventIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const scrollElementRef = useRef<HTMLElement | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const prevActiveNodeIdRef = useRef<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  const events = useFeedbackStore((state) => state.events);
  const { activeNodeId: contextNodeId } = useActiveNode();
  const reduced = useReducedMotion();

  const activeNodeId = activeNode?.id ?? contextNodeId ?? null;
  const activeNodeLabel =
    activeNode?.data?.label ??
    nodes.find((node) => node.id === activeNodeId)?.data?.label ??
    null;

  // Performance checkpoint: Stream events transformation
  // Avoid re-render when feedback array length unchanged
  const eventsLengthRef = useRef(events.length);
  const streamEventsCacheRef = useRef<StreamEvent[]>([]);
  const streamEvents = useMemo<StreamEvent[]>(() => {
    // Skip transformation if length unchanged (optimization)
    if (events.length === eventsLengthRef.current && events.length > 0) {
      return streamEventsCacheRef.current;
    }
    eventsLengthRef.current = events.length;
    const result = events.map(toStreamEvent).reverse();
    streamEventsCacheRef.current = result;
    return result;
  }, [events.length]); // Only depend on length, not full array

  // Performance checkpoint: Filtered events
  const filteredEvents = useMemo<StreamEvent[]>(() => {
    console.time("[GraphContextStream] filteredEvents computation");
    let result: StreamEvent[];
    
    if (filter === "ai") {
      result = streamEvents.filter(
        (event) => event.type === "ai_explain" || event.type === "ai_summary"
      );
    } else if (filter === "events") {
      result = streamEvents.filter(
        (event) => event.type !== "ai_explain" && event.type !== "ai_summary"
      );
    } else {
      result = streamEvents;
    }
    
    console.timeEnd("[GraphContextStream] filteredEvents computation");
    return result;
  }, [streamEvents, filter]);

  // Performance checkpoint: Filtered + pinned events (memoized)
  // Note: pinnedEventIds Set reference changes on state update, triggering recomputation
  const filteredAndPinnedEvents = useMemo<StreamEvent[]>(() => {
    console.time("[GraphContextStream] filteredAndPinnedEvents computation");
    
    const pinned: StreamEvent[] = [];
    const unpinned: StreamEvent[] = [];
    
    filteredEvents.forEach((event) => {
      const eventWithPinned = {
        ...event,
        isPinned: pinnedEventIds.has(event.id),
      };
      
      if (eventWithPinned.isPinned) {
        pinned.push(eventWithPinned);
      } else {
        unpinned.push(eventWithPinned);
      }
    });
    
    // Pinned events first, then unpinned
    const result = [...pinned, ...unpinned];
    
    console.timeEnd("[GraphContextStream] filteredAndPinnedEvents computation");
    return result;
  }, [filteredEvents, pinnedEventIds]);

  // Keep scroll position stable when switching node selection
  useEffect(() => {
    const currentActiveNodeId = activeNodeId;
    const prevActiveNodeId = prevActiveNodeIdRef.current;
    
    if (prevActiveNodeId !== null && prevActiveNodeId !== currentActiveNodeId) {
      // Node selection changed - restore scroll position
      if (virtuosoRef.current && scrollPositionRef.current > 0) {
        console.time("[GraphContextStream] scroll position restore");
        virtuosoRef.current.scrollTo({
          top: scrollPositionRef.current,
          behavior: "auto",
        });
        console.timeEnd("[GraphContextStream] scroll position restore");
      }
    }
    
    prevActiveNodeIdRef.current = currentActiveNodeId;
  }, [activeNodeId]);

  // Load pinned events on mount
  useEffect(() => {
    const loadPinnedEvents = async () => {
      try {
        const stored = await localforage.getItem<string[]>(PINNED_EVENTS_KEY);
        if (stored && Array.isArray(stored)) {
          setPinnedEventIds(new Set(stored));
        }
      } catch (err) {
        console.error("Failed to load pinned events:", err);
      }
    };
    void loadPinnedEvents();
  }, []);

  // Save pinned events whenever they change
  useEffect(() => {
    const savePinnedEvents = async () => {
      try {
        await localforage.setItem(PINNED_EVENTS_KEY, Array.from(pinnedEventIds));
      } catch (err) {
        console.error("Failed to save pinned events:", err);
      }
    };
    if (pinnedEventIds.size > 0 || pinnedEventIds.size === 0) {
      void savePinnedEvents();
    }
  }, [pinnedEventIds]);

  const handlePinToggle = useCallback((eventId: string) => {
    setPinnedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, []);

  // Helper: Check if event is focused
  const isFocused = useCallback((event: StreamEvent) => {
    return focusedId === event.id || 
           (activeNodeId && event.nodeId === activeNodeId && focusedId === null);
  }, [focusedId, activeNodeId]);

  // Handle keyboard navigation for event items
  const handleItemKeyDown = useCallback((e: React.KeyboardEvent, event: StreamEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (event.nodeId && onNodeSelect) {
        onNodeSelect(event.nodeId);
      }
      // Open ExplainOverlay if available
      if (activeNodeId) {
        setShowExplain(true);
      }
    }
  }, [onNodeSelect, activeNodeId]);

  // Focus sync: When activeNodeId changes, scroll to matching event and apply focus
  useEffect(() => {
    if (!activeNodeId) {
      setFocusedId(null);
      return;
    }

    const matchingEvent = filteredAndPinnedEvents.find(
      (ev) => ev.nodeId === activeNodeId
    );

    if (matchingEvent) {
      setFocusedId(matchingEvent.id);
      const index = filteredAndPinnedEvents.findIndex((ev) => ev.id === matchingEvent.id);
      if (index >= 0 && virtuosoRef.current) {
        virtuosoRef.current.scrollToIndex({
          index,
          align: "center",
          behavior: reduced ? "auto" : "smooth",
        });
      }
    }
  }, [activeNodeId, filteredAndPinnedEvents, reduced]);

  // Get reference to scroll element
  const handleScrollerRef = useCallback((element: Window | HTMLElement | null) => {
    scrollElementRef.current = element instanceof HTMLElement ? element : null;
  }, []);

  // Scroll Idle Optimization: Debounce scroll callbacks with requestIdleCallback
  const scrollDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const updateScrollTop = useCallback((scrollTop: number) => {
    scrollPositionRef.current = scrollTop;
  }, []);

  // Set up scroll listener with cleanup and debounce
  useEffect(() => {
    const element = scrollElementRef.current;
    if (!element) return;

    const handleScroll = () => {
      const scrollTop = element.scrollTop;
      
      // Clear existing debounce
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }

      // Debounce scroll updates to 100ms
      scrollDebounceRef.current = setTimeout(() => {
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          (window as any).requestIdleCallback(() => {
            updateScrollTop(scrollTop);
          }, { timeout: 100 });
        } else {
          updateScrollTop(scrollTop);
        }
      }, 100);
    };

    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      element.removeEventListener("scroll", handleScroll);
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }
    };
  }, [filteredAndPinnedEvents.length, updateScrollTop]); // Re-attach when list changes

  // Track scroll position using Virtuoso's rangeChanged callback as backup
  const handleRangeChanged = useCallback((range: { startIndex: number; endIndex: number }) => {
    // Backup: update scroll position if we have the element
    if (scrollElementRef.current) {
      scrollPositionRef.current = scrollElementRef.current.scrollTop;
    }
  }, []);

  return (
    <motion.div
      className="relative flex h-full w-[360px] flex-col overflow-hidden border-l border-neutral-800 bg-neutral-900/95 motion-soft"
      initial={reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={reduced ? { duration: 0 } : { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/60 p-3 text-sm text-neutral-300 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2">
          <Info size={16} className="text-cyan-400" />
          {activeNodeLabel ? (
            <span className="truncate">{activeNodeLabel}</span>
          ) : (
            <span className="italic text-neutral-500">Kein Node ausgewählt</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2 py-1 text-xs ${
              filter === "all"
                ? "rounded-md bg-cyan-500/20 text-cyan-300"
                : "rounded-md bg-neutral-800 text-neutral-400"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("ai")}
            className={`px-2 py-1 text-xs ${
              filter === "ai"
                ? "rounded-md bg-cyan-500/20 text-cyan-300"
                : "rounded-md bg-neutral-800 text-neutral-400"
            }`}
          >
            AI
          </button>
          <button
            type="button"
            onClick={() => setFilter("events")}
            className={`px-2 py-1 text-xs ${
              filter === "events"
                ? "rounded-md bg-cyan-500/20 text-cyan-300"
                : "rounded-md bg-neutral-800 text-neutral-400"
            }`}
          >
            Events
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/50 px-3 py-2 text-xs text-neutral-500">
        <div className="flex items-center gap-2">
          <Filter size={14} />
          <span>
            {filter === "all"
              ? "Alle Ereignisse"
              : filter === "ai"
              ? "AI Zusammenfassungen"
              : "Verlauf & Sync"}
          </span>
        </div>
        {activeNodeLabel && (
          <span className="rounded bg-neutral-800 px-2 py-1 text-neutral-400">
            {activeNodeLabel}
          </span>
        )}
      </div>

      <section
        role="feed"
        aria-label="Context Stream"
        className="flex-1 overflow-hidden"
        data-perf-id="context-stream"
      >
        {filteredAndPinnedEvents.length === 0 ? (
          <div className="mt-6 text-center text-xs text-neutral-600 px-3">
            Keine Ereignisse für diesen Filter.
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            scrollerRef={handleScrollerRef}
            data={filteredAndPinnedEvents}
            totalCount={filteredAndPinnedEvents.length}
            increaseViewportBy={200}
            itemContent={(index, event) => {
              const eventFocused = isFocused(event);
              return (
                <div className="px-3 pb-3">
                  <motion.div
                    ref={(el) => {
                      if (el) {
                        itemRefs.current.set(event.id, el);
                      } else {
                        itemRefs.current.delete(event.id);
                      }
                    }}
                    role="article"
                    aria-describedby={`event-text-${event.id}`}
                    tabIndex={0}
                    data-test="ctx-item"
                    data-test-pinned={event.isPinned ? "true" : "false"}
                    key={event.id}
                    className={`border p-3 transition-colors cursor-pointer ${
                      activeNodeId && event.nodeId === activeNodeId
                        ? "border-cyan-500/40 bg-cyan-900/30 hover:bg-cyan-900/40"
                        : "border-neutral-800 bg-neutral-900/70 hover:bg-neutral-900"
                    } ${event.isPinned ? "border-yellow-500/40 bg-yellow-900/20" : ""} ${
                      eventFocused
                        ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-neutral-900"
                        : ""
                    }`}
                    initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }
                    }
                    onKeyDown={(e) => handleItemKeyDown(e, event)}
                    onClick={() => {
                      if (event.nodeId && onNodeSelect) {
                        onNodeSelect(event.nodeId);
                      }
                    }}
                    onFocus={() => setFocusedId(event.id)}
                    onBlur={() => {
                      // Only clear focus if not switching to another item
                      setTimeout(() => {
                        const activeEl = document.activeElement;
                        if (!itemRefs.current.has(event.id) || 
                            (activeEl && !itemRefs.current.get(event.id)?.contains(activeEl))) {
                          setFocusedId(null);
                        }
                      }, 0);
                    }}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="sr-only">{event.type}</span>
                      <span className="text-xs uppercase tracking-wide text-neutral-400">
                        {event.type}
                        {event.isPinned && (
                          <span className="ml-2 text-yellow-400" aria-label="Pinned">
                            📌
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePinToggle(event.id);
                        }}
                        aria-label={event.isPinned ? "Unpin entry" : "Pin entry"}
                        aria-pressed={event.isPinned ? "true" : "false"}
                        className={`transition-colors ${
                          event.isPinned
                            ? "text-yellow-400 hover:text-yellow-300"
                            : "text-neutral-500 hover:text-cyan-400"
                        }`}
                      >
                        <Pin size={14} fill={event.isPinned ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <div
                      id={`event-text-${event.id}`}
                      className="text-sm text-neutral-200 whitespace-pre-wrap"
                    >
                      {event.message || "(kein Text)"}
                    </div>
                  </motion.div>
                </div>
              );
            }}
            scrollSeekConfiguration={{
              enter: (velocity) => Math.abs(velocity) > 200,
              exit: (velocity) => Math.abs(velocity) < 30,
            }}
            rangeChanged={handleRangeChanged}
            style={{ height: "100%" }}
            defaultItemHeight={120}
            overscan={5}
          />
        )}
      </section>

      {activeNodeId && (
        <div className="border-t border-neutral-800 bg-neutral-900/60 p-3 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setShowExplain(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-cyan-600/20 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-600/30"
          >
            <Sparkles size={16} />
            Erkläre diesen Gedanken
          </button>
        </div>
      )}

      <AnimatePresence>
        {showExplain && (
          <ExplainOverlay
            onClose={() => setShowExplain(false)}
            nodeId={activeNodeId}
            nodeLabel={activeNodeLabel}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

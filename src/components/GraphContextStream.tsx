"use client";

import React, { useMemo, useState, useRef, useCallback, useEffect, memo, Profiler } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Node, Edge } from "reactflow";
import { Sparkles, Pin, Filter, Info } from "lucide-react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { useFeedbackStore, type FeedbackEvent } from "@/store/FeedbackStore";
import { useActiveNode } from "@/context/ActiveNodeContext";
import ExplainOverlay from "@/components/ExplainOverlay";
import { useExplainConfidenceColor } from "@/hooks/useExplainConfidenceColor";
import localforage from "localforage";
import { Panel } from "@/components/Panel";
import { useAutoFocusScroll } from "@/hooks/useAutoFocusScroll";

type FilterMode = "all" | "ai" | "events";

const PINNED_EVENTS_KEY = "filon-pinned-events";

interface GraphContextStreamProps {
  activeNode?: Node | null;
  nodes?: Node[];
  edges?: Edge[];
  onNodeSelect?: (nodeId: string) => void;
  position?: "bottom" | "side";
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

// Component for inline AI summary display
function AISummaryInline({
  summary,
  nodeId,
  onOpenExplain,
}: {
  summary: { text: string; confidence: number; eventId: string };
  nodeId: string;
  onOpenExplain: () => void;
}) {
  const confidenceColor = useExplainConfidenceColor(summary.confidence);
  const truncatedText = summary.text.length > 100
    ? `${summary.text.slice(0, 100)}...`
    : summary.text;
  
  const colorClass = confidenceColor === "emerald-400" ? "text-emerald-400" :
                     confidenceColor === "yellow-400" ? "text-yellow-400" :
                     "text-orange-400";
  
  return (
    <div className="mt-2 pt-2 border-t border-neutral-800">
      <div
        className="group relative"
        onClick={(e) => {
          e.stopPropagation();
          onOpenExplain();
        }}
      >
        <div className="text-xs text-text-secondary line-clamp-2 cursor-pointer hover:text-brand transition-colors">
          {truncatedText}
        </div>
        {/* Tooltip with full text on hover */}
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 w-64 p-2 bg-surface-active rounded-xl text-xs text-text-primary shadow-lg border border-neutral-700">
          {summary.text}
        </div>
      </div>
    </div>
  );
}

export default function GraphContextStream({
  activeNode,
  nodes = [],
  edges: _edges = [],
  onNodeSelect,
  position = "side",
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
  const focusedItemRef = useRef<HTMLDivElement | null>(null);
  
  // Update focusedItemRef when focusedId changes
  useEffect(() => {
    if (focusedId && itemRefs.current.has(focusedId)) {
      focusedItemRef.current = itemRefs.current.get(focusedId) || null;
    } else {
      focusedItemRef.current = null;
    }
  }, [focusedId]);
  
  // Use auto-focus scroll hook for focused items
  useAutoFocusScroll(focusedItemRef as React.RefObject<HTMLElement>, focusedId !== null, 800);
  
  const events = useFeedbackStore((state) => state.events);
  const { activeNodeId: contextNodeId } = useActiveNode();
  const reduced = useReducedMotion();
  const [showExplainOverlay, setShowExplainOverlay] = useState(false);
  const [explainNodeId, setExplainNodeId] = useState<string | null>(null);

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
        (event) => event.type === "ai_explain" || event.type === "ai_summary" || event.type === "ai_summary_v2"
      );
    } else if (filter === "events") {
      result = streamEvents.filter(
        (event) => event.type !== "ai_explain" && event.type !== "ai_summary" && event.type !== "ai_summary_v2"
      );
    } else {
      result = streamEvents;
    }
    
    console.timeEnd("[GraphContextStream] filteredEvents computation");
    return result;
  }, [streamEvents, filter]);

  // Get last AI summary for each node
  const nodeSummaries = useMemo(() => {
    const summaries = new Map<string, { text: string; confidence: number; eventId: string }>();
    events
      .filter((e) => e.type === "ai_summary_v2" && e.nodeId)
      .forEach((e) => {
        if (e.nodeId && e.message) {
          summaries.set(e.nodeId, {
            text: e.message,
            confidence: e.confidence || 0.8,
            eventId: e.id,
          });
        }
      });
    return summaries;
  }, [events]);

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
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const currentIndex = filteredAndPinnedEvents.findIndex((ev) => ev.id === event.id);
      if (currentIndex < filteredAndPinnedEvents.length - 1) {
        const nextEvent = filteredAndPinnedEvents[currentIndex + 1];
        setFocusedId(nextEvent.id);
        const nextElement = itemRefs.current.get(nextEvent.id);
        if (nextElement) {
          nextElement.focus();
          virtuosoRef.current?.scrollToIndex({
            index: currentIndex + 1,
            align: "center",
            behavior: reduced ? "auto" : "smooth",
          });
        }
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const currentIndex = filteredAndPinnedEvents.findIndex((ev) => ev.id === event.id);
      if (currentIndex > 0) {
        const prevEvent = filteredAndPinnedEvents[currentIndex - 1];
        setFocusedId(prevEvent.id);
        const prevElement = itemRefs.current.get(prevEvent.id);
        if (prevElement) {
          prevElement.focus();
          virtuosoRef.current?.scrollToIndex({
            index: currentIndex - 1,
            align: "center",
            behavior: reduced ? "auto" : "smooth",
          });
        }
      }
    }
  }, [onNodeSelect, activeNodeId, filteredAndPinnedEvents, reduced]);

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

  // Throttle hover sync to 60ms
  const hoverSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const throttledHoverSync = useCallback((nodeId: string | null) => {
    if (hoverSyncTimeoutRef.current) {
      clearTimeout(hoverSyncTimeoutRef.current);
    }
    hoverSyncTimeoutRef.current = setTimeout(() => {
      // Hover sync logic here if needed
    }, 60);
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

  // Calculate height based on position
  const heightStyle = position === "bottom"
    ? { 
        height: 'clamp(35vh, var(--context-height, 40vh), 45vh)',
        maxHeight: typeof window !== 'undefined' && window.innerWidth < 768 
          ? 'clamp(50vh, var(--context-height, 55vh), 60vh)' 
          : 'clamp(35vh, var(--context-height, 40vh), 45vh)',
      }
    : { height: '100%' };

  const wrapperClasses = position === "bottom"
    ? "relative flex w-full flex-col overflow-hidden border-t border-neutral-800 bg-neutral-900/95 motion-soft"
    : "relative flex h-full w-[360px] flex-col overflow-hidden border-l border-neutral-800 bg-neutral-900/95 motion-soft";

  const initialAnimation = position === "bottom"
    ? reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
    : reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 };

  const animateAnimation = position === "bottom"
    ? { opacity: 1, y: 0 }
    : { opacity: 1, x: 0 };
  const panelRole = position === "side" ? "complementary" : "region";

  return (
    <motion.div
      className={wrapperClasses}
      style={heightStyle}
      role={panelRole}
      aria-label="Context Stream Panel"
      data-testid="graph-context-stream"
      data-position={position}
      initial={initialAnimation}
      animate={animateAnimation}
      transition={reduced ? { duration: 0 } : { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div
        data-testid="graph-context-stream-header"
        className={`flex items-center justify-between ${position === "bottom" ? "border-b" : "border-b"} border-neutral-800 bg-surface-hover/90 p-3 text-sm text-text-primary backdrop-blur-md shadow-inner sticky top-0 z-10`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Info size={16} className="text-brand" />
          <span className="font-semibold">Context Stream</span>
          {activeNodeLabel ? (
            <span className="truncate">• {activeNodeLabel}</span>
          ) : (
            <span className="italic text-text-muted">• Kein Node ausgewählt</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-2 py-1 text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 ${
              filter === "all"
                ? "bg-brand/20 text-brand"
                : "bg-neutral-800 text-text-secondary"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("ai")}
            className={`px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 ${
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
            className={`px-2 py-1 text-xs focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 ${
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

      <Profiler
        id="ContextStream"
        onRender={(id, phase, actualDuration) => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[React.Profiler] ${id} ${phase}: ${actualDuration.toFixed(2)}ms`);
          }
        }}
      >
        <section
          role="list"
          aria-label="Context Stream"
          className="flex-1 overflow-hidden"
          data-perf-id="context-stream"
          tabIndex={0}
          onKeyDown={(e) => {
            // Global keyboard shortcuts for Context Stream
            if (e.key === "ArrowDown" && filteredAndPinnedEvents.length > 0) {
              e.preventDefault();
              const firstEvent = filteredAndPinnedEvents[0];
              setFocusedId(firstEvent.id);
              const firstElement = itemRefs.current.get(firstEvent.id);
              if (firstElement) {
                firstElement.focus();
              }
            }
          }}
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
                <ContextStreamItem
                  key={event.id}
                  event={event}
                  eventFocused={eventFocused}
                  activeNodeId={activeNodeId}
                  onNodeSelect={onNodeSelect}
                  onPinToggle={handlePinToggle}
                  onItemKeyDown={handleItemKeyDown}
                  setFocusedId={setFocusedId}
                  itemRefs={itemRefs}
                  focusedItemRef={focusedItemRef}
                  nodeSummaries={nodeSummaries}
                  setExplainNodeId={setExplainNodeId}
                  setShowExplainOverlay={setShowExplainOverlay}
                  nodes={nodes}
                  reduced={reduced}
                />
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
      </Profiler>

      {activeNodeId && (
        <div className="border-t border-neutral-800 bg-surface-hover/90 p-3 backdrop-blur-md shadow-inner">
          <button
            type="button"
            onClick={() => setShowExplain(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand/20 px-3 py-2 text-sm text-brand transition-colors hover:bg-brand/30 hover:glow"
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
        {showExplainOverlay && explainNodeId && (
          <ExplainOverlay
            onClose={() => {
              setShowExplainOverlay(false);
              setExplainNodeId(null);
            }}
            nodeId={explainNodeId}
            nodeLabel={nodes.find((n) => n.id === explainNodeId)?.data?.label || null}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Memoized Context Stream Item component for performance
const ContextStreamItem = memo(({
  event,
  eventFocused,
  activeNodeId,
  onNodeSelect,
  onPinToggle,
  onItemKeyDown,
  setFocusedId,
  itemRefs,
  focusedItemRef,
  nodeSummaries,
  setExplainNodeId,
  setShowExplainOverlay,
  nodes,
  reduced,
}: {
  event: StreamEvent;
  eventFocused: boolean;
  activeNodeId: string | null;
  onNodeSelect?: (nodeId: string) => void;
  onPinToggle: (eventId: string) => void;
  onItemKeyDown: (e: React.KeyboardEvent, event: StreamEvent) => void;
  setFocusedId: (id: string) => void;
  itemRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
  focusedItemRef: React.MutableRefObject<HTMLDivElement | null>;
  nodeSummaries: Map<string, { text: string; confidence: number; eventId: string }>;
  setExplainNodeId: (id: string | null) => void;
  setShowExplainOverlay: (show: boolean) => void;
  nodes: Node[];
  reduced: boolean;
}) => {
  const handleRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(event.id, el);
      if (eventFocused) {
        focusedItemRef.current = el;
      }
    } else {
      itemRefs.current.delete(event.id);
      if (focusedItemRef.current === el) {
        focusedItemRef.current = null;
      }
    }
  }, [event.id, eventFocused, itemRefs]);

  return (
    <div className="px-3 pb-3">
      <Panel id={event.id}>
        <motion.div
          ref={handleRef}
                      role="article"
                      aria-describedby={`event-text-${event.id}`}
                      tabIndex={0}
                      data-test="ctx-item"
                      data-test-pinned={event.isPinned ? "true" : "false"}
                      key={event.id}
                      className={`border p-3 transition-all duration-200 cursor-pointer ${
                        activeNodeId && event.nodeId === activeNodeId
                          ? "border-brand/40 bg-brand-dark/30 hover:bg-brand-dark/40"
                          : "border-neutral-800 hover:bg-surface-hover"
                      } ${event.isPinned ? "border-brand-soft shadow-glow" : ""} ${
                        eventFocused
                          ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-surface-base glow-interactive"
                          : ""
                      }`}
                      style={{
                        boxShadow: eventFocused
                          ? "0 0 20px rgba(6, 182, 212, 0.4)"
                          : undefined,
                      }}
                      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }
                      }
                      onKeyDown={(e) => onItemKeyDown(e, event)}
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
                        <span className="text-xs uppercase tracking-wide text-text-secondary">
                          {event.type}
                          {event.isPinned && (
                            <span className="ml-2 text-accent-warning" aria-label="Pinned">
                              📌
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPinToggle(event.id);
                          }}
                          aria-label={event.isPinned ? "Unpin entry" : "Pin entry"}
                          aria-pressed={event.isPinned ? "true" : "false"}
                          className={`transition-colors ${
                            event.isPinned
                              ? "text-accent-warning hover:text-accent-warning/80"
                              : "text-text-muted hover:text-brand"
                          }`}
                        >
                          <Pin size={14} fill={event.isPinned ? "currentColor" : "none"} />
                        </button>
                      </div>
                      <div
                        id={`event-text-${event.id}`}
                        className="text-sm text-text-primary whitespace-pre-wrap"
                      >
                        {event.message || "(kein Text)"}
                      </div>
                      
                      {/* Display last AI summary inline under related feedback entry */}
                      {event.nodeId && nodeSummaries.has(event.nodeId) && (
                        <AISummaryInline
                          summary={nodeSummaries.get(event.nodeId)!}
                          nodeId={event.nodeId!}
                          onOpenExplain={() => {
                            setExplainNodeId(event.nodeId);
                            setShowExplainOverlay(true);
                          }}
                        />
                      )}
                    </motion.div>
                  </Panel>
                </div>
  );
});

ContextStreamItem.displayName = 'ContextStreamItem';

"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Node, Edge } from "reactflow";
import { Sparkles, Pin, Filter, Info } from "lucide-react";
import { useFeedbackStore, type FeedbackEvent } from "@/store/FeedbackStore";
import { useActiveNode } from "@/context/ActiveNodeContext";
import ExplainOverlay from "@/components/ExplainOverlay";

type FilterMode = "all" | "ai" | "events";

interface GraphContextStreamProps {
  activeNode?: Node | null;
  nodes?: Node[];
  edges?: Edge[];
  onNodeSelect?: (nodeId: string) => void;
}

interface StreamEvent {
  id: string;
  type: FeedbackEvent["type"] | "ai_summary";
  message: string;
  timestamp: number;
  nodeId: string | null;
}

function toStreamEvent(event: FeedbackEvent): StreamEvent {
  const payload = event.payload as
    | { message?: string; nodeId?: string; summary?: string }
    | undefined;

  const message =
    payload?.message ??
    payload?.summary ??
    (typeof event.payload === "string"
      ? event.payload
      : JSON.stringify(event.payload ?? {}));

  return {
    id: event.id,
    type: event.type,
    message,
    timestamp: event.timestamp,
    nodeId: payload?.nodeId ?? null,
  };
}

export default function GraphContextStream({
  activeNode,
  nodes = [],
}: GraphContextStreamProps) {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [showExplain, setShowExplain] = useState<boolean>(false);
  const events = useFeedbackStore((state) => state.events);
  const { activeNodeId: contextNodeId } = useActiveNode();

  const activeNodeId = activeNode?.id ?? contextNodeId ?? null;
  const activeNodeLabel =
    activeNode?.data?.label ??
    nodes.find((node) => node.id === activeNodeId)?.data?.label ??
    null;

  const streamEvents = useMemo<StreamEvent[]>(() => {
    return events.map(toStreamEvent).reverse();
  }, [events]);

  const filteredEvents = useMemo<StreamEvent[]>(() => {
    if (filter === "ai") {
      return streamEvents.filter(
        (event) => event.type === "ai_explain" || event.type === "ai_summary"
      );
    }
    if (filter === "events") {
      return streamEvents.filter(
        (event) => event.type !== "ai_explain" && event.type !== "ai_summary"
      );
    }
    return streamEvents;
  }, [streamEvents, filter]);

  return (
    <motion.div
      className="relative flex h-full w-[360px] flex-col overflow-hidden border-l border-neutral-800 bg-neutral-900/95"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
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

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-2">
        {filteredEvents.length === 0 ? (
          <div className="mt-6 text-center text-xs text-neutral-600">
            Keine Ereignisse für diesen Filter.
          </div>
        ) : (
          filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              className="border border-neutral-800 bg-neutral-900/70 p-3 transition-colors hover:bg-neutral-900"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-neutral-400">
                  {event.type}
                </span>
                <button
                  type="button"
                  className="text-neutral-500 transition-colors hover:text-cyan-400"
                  aria-label="Anpinnen"
                >
                  <Pin size={14} />
                </button>
              </div>
              <div className="text-sm text-neutral-200 whitespace-pre-wrap">
                {event.message || "(kein Text)"}
              </div>
            </motion.div>
          ))
        )}
      </div>

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
            activeNodeLabel={activeNodeLabel}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

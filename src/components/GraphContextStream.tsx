"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Node, Edge } from "reactflow";
import { useFeedbackStore } from "@/store/FeedbackStore";
import { useActiveNode } from "@/context/ActiveNodeContext";

interface GraphContextStreamProps {
  activeNode?: Node | null;
  nodes?: Node[];
  edges?: Edge[];
  onNodeSelect?: (nodeId: string) => void;
}

export default function GraphContextStream({
  activeNode,
  nodes = [],
  edges = [],
  onNodeSelect,
}: GraphContextStreamProps) {
  const [filter, setFilter] = useState<"all" | "ai" | "feedback" | "pins">(
    "all"
  );
  const events = useFeedbackStore((s) => s.events);
  const { activeNodeId } = useActiveNode();

  // TODO: Stream List with AI summaries, feedback, explain mode, pins, filters
  // TODO: Add real-time updates from feedback store
  // TODO: Add AI summary generation for selected nodes
  // TODO: Add pinning functionality
  // TODO: Add filtering and search
  // TODO: Add explain mode overlay integration

  const recentEvents = events.slice(-10).reverse();

  return (
    <motion.div
      className="w-[340px] h-full bg-neutral-900/90 border-l border-neutral-800 flex flex-col overflow-hidden"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="p-4 text-neutral-400 text-sm border-b border-neutral-800 flex items-center justify-between">
        <span className="font-medium">Context Stream</span>
        <div className="flex gap-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              filter === "all"
                ? "bg-cyan-500/20 text-cyan-400"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("ai")}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              filter === "ai"
                ? "bg-cyan-500/20 text-cyan-400"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            AI
          </button>
          <button
            onClick={() => setFilter("feedback")}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              filter === "feedback"
                ? "bg-cyan-500/20 text-cyan-400"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Events
          </button>
        </div>
      </div>

      {/* Active Node Info */}
      {activeNode && (
        <div className="p-3 border-b border-neutral-800 bg-neutral-800/50">
          <div className="text-xs text-neutral-400 mb-1">Active Node</div>
          <div className="text-sm text-neutral-100 font-medium truncate">
            {activeNode.data?.label || "Unnamed"}
          </div>
          {/* TODO: Show AI summary, confidence, tags, connections count */}
        </div>
      )}

      {/* Stream Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {recentEvents.length === 0 && !activeNode ? (
          <div className="text-neutral-500 text-xs text-center py-8">
            Keine Einträge. Beginne mit einem Gedanken im Brainbar oben.
          </div>
        ) : (
          <AnimatePresence>
            {recentEvents.map((event) => {
              const message =
                event.payload?.message || String(event.payload || "");
              const isError =
                event.payload?.error || event.type === "sync_failed";
              const isSuccess =
                event.type === "sync_success" || event.type === "node_added";

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-2 rounded-lg text-xs ${
                    isSuccess
                      ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                      : isError
                      ? "bg-red-500/10 text-red-300 border border-red-500/20"
                      : "bg-neutral-800/50 text-neutral-300"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-neutral-500 text-[10px] mt-0.5">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="flex-1">{message}</span>
                  </div>
                  {/* TODO: Add action buttons (pin, explain, dismiss) */}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* TODO: Add AI Summary Cards */}
        {/* TODO: Add Explain Mode Overlay */}
        {/* TODO: Add Pinned Items Section */}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-neutral-800 flex gap-2">
        <button
          className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs text-neutral-300 transition-colors"
          onClick={() => {
            // TODO: Implement explain mode toggle
            console.log("Explain mode toggle");
          }}
        >
          Explain Mode
        </button>
        <button
          className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs text-neutral-300 transition-colors"
          onClick={() => {
            // TODO: Implement AI summary generation
            console.log("Generate AI summary");
          }}
        >
          AI Summary
        </button>
      </div>
    </motion.div>
  );
}

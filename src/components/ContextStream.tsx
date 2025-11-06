"use client";

import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useFeature } from "@/config/featureFlags";
import { useContextStreamStore } from "@/store/ContextStreamStore";
import { Brain } from "lucide-react";
import type { AISummary } from "@/ai/summarizerCore";
import { ContextStreamPanel } from "@/components/panels/ContextStream";

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function Thread({ entries }: { entries: AISummary[] }) {
  const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className="mb-4">
      {sorted.map((summary, idx) => (
        <div key={summary.id} className="relative">
          {idx > 0 && (
            <div className="absolute left-3 top-0 bottom-0 w-px border-l border-cyan-800/30" />
          )}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: summary.confidence }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="ml-3 pl-3 pb-2"
          >
            <span
              className={`text-sm ${
                summary.confidence >= 0.9
                  ? "text-emerald-400"
                  : summary.confidence >= 0.8
                  ? "text-yellow-400"
                  : "text-orange-400"
              }`}
            >
              {summary.text}
            </span>
            <span className="ml-2 text-xs text-gray-500">
              ({(summary.confidence * 100).toFixed(1)}%)
            </span>
          </motion.div>
        </div>
      ))}
    </div>
  );
}

export default function ContextStream() {
  const enabled = useFeature("CONTEXT_STREAM");
  const { summaries, loadSummaries, startDecay, stopDecay } =
    useContextStreamStore();
  const [activePanelId, setActivePanelId] = useState<string>("");

  useEffect(() => {
    loadSummaries();
    startDecay();
    return () => stopDecay();
  }, [loadSummaries, startDecay, stopDecay]);

  const grouped = useMemo(() => groupBy(summaries, "threadId"), [summaries]);

  if (!enabled) return null;

  const panels = Object.entries(grouped).map(([id, list]) => ({
    id,
    content: <Thread key={id} entries={list} />,
  }));

  return (
    <div className="p-4 border border-cyan-700/30 rounded-2xl bg-black/40 shadow-inner">
      <h3 className="text-cyan-300 mb-2 font-medium flex items-center gap-2">
        <Brain size={16} /> Context Stream
      </h3>
      {summaries.length === 0 ? (
        <p className="text-gray-500 text-sm">No AI explanations yet.</p>
      ) : (
        <motion.div
          className="relative flex flex-col gap-6 perspective-[1200px]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {panels.map((p, i) => (
            <ContextStreamPanel
              key={p.id}
              id={p.id}
              activeId={activePanelId}
              onMouseEnter={() => setActivePanelId(p.id)}
              onMouseLeave={() => setActivePanelId("")}
              style={{ transform: `translateZ(${i * -20}px)` }}
            >
              {p.content}
            </ContextStreamPanel>
          ))}
        </motion.div>
      )}
    </div>
  );
}

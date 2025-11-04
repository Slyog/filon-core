"use client";

import { useFeature } from "@/config/featureFlags";
import { useExplainCache } from "@/store/ExplainCache";
import { Brain } from "lucide-react";

export default function ContextStream() {
  const enabled = useFeature("CONTEXT_STREAM");
  const { cache } = useExplainCache();

  if (!enabled) return null;

  return (
    <div className="p-4 border border-cyan-700/30 rounded-2xl bg-black/40 shadow-inner">
      <h3 className="text-cyan-300 mb-2 font-medium flex items-center gap-2">
        <Brain size={16} /> Context Stream
      </h3>
      {Object.values(cache).length === 0 ? (
        <p className="text-gray-500 text-sm">No AI explanations yet.</p>
      ) : (
        <ul className="space-y-2 text-sm text-gray-100">
          {Object.values(cache)
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((entry) => (
              <li
                key={entry.title}
                className="border-b border-cyan-800/30 pb-2"
              >
                <span className="text-cyan-200 font-medium">{entry.title}</span>{" "}
                → <span className="text-gray-300">{entry.summary}</span>{" "}
                <span
                  className={`ml-2 text-xs ${
                    entry.confidence >= 0.9
                      ? "text-emerald-400"
                      : entry.confidence >= 0.8
                      ? "text-yellow-400"
                      : "text-orange-400"
                  }`}
                >
                  ({(entry.confidence * 100).toFixed(1)}%)
                </span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

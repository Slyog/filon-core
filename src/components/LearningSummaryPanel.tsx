"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { generateLearningSummary } from "@/lib/ai/generateLearningSummary";

export default function LearningSummaryPanel() {
  const [summary, setSummary] = useState<string>("Lade Lernanalyse...");
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      const s = await generateLearningSummary();
      if (s) {
        setSummary(s);
      } else {
        setSummary("Keine relevanten Aktivitäten erkannt.");
      }
    }
    loadSummary();
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed bottom-4 right-4 w-96 z-50"
    >
      <div
        className="bg-zinc-900/95 backdrop-blur-sm border-2 border-cyan-500/30 text-cyan-50 shadow-xl rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 0 20px rgba(59, 130, 246, 0.15)" }}
      >
        {/* Header */}
        <div className="p-3 border-b border-cyan-900/30 bg-cyan-900/10 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="text-base">🧠</span>
            Learning Summary
          </h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-cyan-400 hover:text-cyan-200 transition-colors"
            aria-label="Close Learning Summary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 text-sm whitespace-pre-line text-cyan-100">
          {summary}
        </div>
      </div>
    </motion.div>
  );
}

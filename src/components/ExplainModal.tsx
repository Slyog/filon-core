"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { generatePanelSummary } from "@/ai/summarizerCore";

export default function ExplainModal({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  useEffect(() => {
    const generate = async () => {
      setLoading(true);
      const result = await generatePanelSummary(
        title,
        "the current context stream"
      );
      setSummary(result.text);
      setConfidence(result.confidence);
      setLoading(false);
    };
    generate();
  }, [title]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="modal"
        className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.25 }}
          className="rounded-2xl border border-cyan-700/50 bg-[#0A0F12]/95 p-6 w-[420px] text-gray-100 shadow-xl"
        >
          <h3 className="text-cyan-300 font-medium mb-3">
            AI Explain – {title}
          </h3>

          {loading && (
            <p className="text-gray-400 animate-pulse">Generating summary...</p>
          )}

          {summary && (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="mt-3 rounded-lg border border-cyan-700/30 bg-cyan-900/10 p-3 text-sm text-cyan-100"
            >
              <p>{summary}</p>
              {confidence !== null && (
                <p
                  className={`text-xs mt-2 ${
                    confidence >= 0.9
                      ? "text-emerald-400"
                      : confidence >= 0.8
                      ? "text-yellow-400"
                      : "text-orange-400"
                  }`}
                >
                  Confidence: {(confidence * 100).toFixed(1)} %
                </p>
              )}
            </motion.div>
          )}

          <div className="mt-4 text-right">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-cyan-300 text-sm"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

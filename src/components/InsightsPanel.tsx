"use client";
import { useEffect, useState } from "react";
import {
  generatePersonalizedInsights,
  type Insight,
} from "@/lib/ai/generatePersonalizedInsights";
import { motion, AnimatePresence } from "framer-motion";

export default function InsightsPanel({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      generatePersonalizedInsights().then((ins) => {
        setInsights(ins);
        setLoading(false);
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-4 right-4 w-[420px] z-50"
          style={{ top: "auto" }}
        >
          <div
            className="bg-zinc-900/95 backdrop-blur-sm border-2 border-cyan-500/40 text-cyan-50 shadow-xl rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 0 20px rgba(59, 130, 246, 0.2)" }}
          >
            {/* Header */}
            <div className="p-4 border-b border-cyan-900/30 bg-cyan-900/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                <span className="text-xl">🎯</span>
                Adaptive Insights
              </h2>
              <button
                onClick={onClose}
                className="text-cyan-400 hover:text-cyan-200 transition-colors"
                aria-label="Close Insights"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
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
            <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8 text-cyan-400">
                  <div className="text-2xl mb-2">⏳</div>
                  Analysiere dein Verhalten...
                </div>
              ) : insights.length === 0 ? (
                <div className="text-center py-8 text-cyan-400">
                  <div className="text-2xl mb-2">📊</div>
                  Keine Insights verfügbar
                </div>
              ) : (
                insights.map((ins, index) => (
                  <motion.div
                    key={ins.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border-l-4 pl-3 py-2 rounded-r-lg ${
                      ins.severity === "critical"
                        ? "border-red-500 bg-red-900/10"
                        : ins.severity === "warn"
                        ? "border-amber-500 bg-amber-900/10"
                        : "border-cyan-600 bg-cyan-900/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          ins.severity === "critical"
                            ? "bg-red-900/30 text-red-300"
                            : ins.severity === "warn"
                            ? "bg-amber-900/30 text-amber-300"
                            : "bg-cyan-900/30 text-cyan-300"
                        }`}
                      >
                        {ins.category}
                      </span>
                    </div>
                    <p className="font-medium text-cyan-100 text-sm mb-1">
                      {ins.message}
                    </p>
                    {ins.suggestion && (
                      <p className="text-xs text-cyan-300/80 italic">
                        💡 {ins.suggestion}
                      </p>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-cyan-900/30 bg-cyan-900/5 text-xs text-cyan-400 text-center">
              Drücke{" "}
              <kbd className="px-1.5 py-0.5 bg-cyan-900/30 rounded">
                Alt + I
              </kbd>{" "}
              um Insights zu öffnen
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


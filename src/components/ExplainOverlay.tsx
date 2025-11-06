"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { generateSummary } from "@/ai/summarizerCore";
import { useFeedbackStore } from "@/store/FeedbackStore";

export interface ExplainOverlayProps {
  onClose: () => void;
  nodeId: string | null;
  nodeLabel?: string | null;
}

export default function ExplainOverlay({
  onClose,
  nodeId,
  nodeLabel,
}: ExplainOverlayProps) {
  const addFeedback = useFeedbackStore((state) => state.addFeedback);
  const [summary, setSummary] = useState<string | null>(null);
  const [confidencePercent, setConfidencePercent] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nodeId) {
      setError("Kein Node ausgewählt.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const title = nodeLabel?.trim() || "Unbenannter Gedanke";
        const { text, confidence } = await generateSummary(title);
        if (cancelled) return;

        const safeConfidence = Math.max(0, Math.min(1, confidence));
        setSummary(text);
        setConfidencePercent(Math.round(safeConfidence * 100));
        setLoading(false);

        addFeedback({
          type: "ai_summary",
          payload: {
            message: text,
            nodeId,
            confidence: safeConfidence,
          },
          nodeId,
          message: text,
          confidence: safeConfidence,
        });
      } catch (err) {
        if (cancelled) return;
        console.error("[ExplainOverlay] Failed to generate summary", err);
        setError("Fehler beim Laden der Zusammenfassung.");
        setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [nodeId, nodeLabel, addFeedback]);

  const confidenceTone =
    confidencePercent >= 90
      ? "text-emerald-400"
      : confidencePercent >= 80
      ? "text-yellow-400"
      : "text-orange-400";

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="relative w-[420px] rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-neutral-500 transition-colors hover:text-neutral-300"
          aria-label="Overlay schließen"
        >
          <X size={18} />
        </button>

        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="text-cyan-400" size={18} />
          <h3 className="text-sm font-medium text-neutral-100">
            AI Erklärung
            {nodeLabel ? ` – ${nodeLabel}` : ""}
          </h3>
        </div>

        {loading && (
          <div className="text-sm text-neutral-500">
            Generiere Zusammenfassung…
          </div>
        )}

        {error && (
          <div className="text-sm text-orange-400" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && summary && (
          <div className="space-y-3 text-sm text-neutral-200">
            <p>{summary}</p>
            <div className="text-xs text-neutral-500">
              Confidence:{" "}
              <span className={`font-medium ${confidenceTone}`}>
                {confidencePercent}%
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

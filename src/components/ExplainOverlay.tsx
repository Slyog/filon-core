"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";

export interface ExplainOverlayProps {
  onClose: () => void;
  activeNodeLabel?: string | null;
}

interface OverlayState {
  summary: string | null;
  confidence: number;
  loading: boolean;
}

export default function ExplainOverlay({
  onClose,
  activeNodeLabel,
}: ExplainOverlayProps) {
  const [{ summary, confidence, loading }, setState] = useState<OverlayState>({
    summary: null,
    confidence: 0,
    loading: true,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const generatedConfidence = Math.floor(80 + Math.random() * 20);
      setState({
        summary:
          "Dies ist eine simulierte AI-Zusammenfassung des ausgewählten Gedankens.",
        confidence: generatedConfidence,
        loading: false,
      });
    }, 800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const confidenceTone =
    confidence >= 90
      ? "text-emerald-400"
      : confidence >= 80
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
            {activeNodeLabel ? ` – ${activeNodeLabel}` : ""}
          </h3>
        </div>

        {loading ? (
          <div className="text-sm text-neutral-500">
            Generiere Zusammenfassung…
          </div>
        ) : (
          <div className="space-y-3 text-sm text-neutral-200">
            <p>{summary}</p>
            <div className="text-xs text-neutral-500">
              Confidence:{" "}
              <span className={`font-medium ${confidenceTone}`}>
                {confidence}%
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

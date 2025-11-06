"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { generateSummary } from "@/ai/summarizerCore";
import { useFeedbackStore } from "@/store/FeedbackStore";
import { useExplainCache } from "@/store/ExplainCache";

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
  const { getEntry, saveEntry, loadCache } = useExplainCache();
  const [summary, setSummary] = useState<string | null>(null);
  const [confidencePercent, setConfidencePercent] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!nodeId) {
      setError("Kein Node ausgewählt.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      // Load cache on mount
      await loadCache();
      
      setLoading(true);
      setError(null);
      
      const title = nodeLabel?.trim() || "Unbenannter Gedanke";
      const cacheKey = `${nodeId}-${title}`;
      
      // Check cache first
      const cached = getEntry(cacheKey);
      if (cached) {
        if (cancelled) return;
        setSummary(cached.summary);
        setConfidencePercent(Math.round(cached.confidence * 100));
        setLoading(false);
        return;
      }

      try {
        const { text, confidence } = await generateSummary(title);
        if (cancelled) return;

        const safeConfidence = Math.max(0, Math.min(1, confidence));
        setSummary(text);
        setConfidencePercent(Math.round(safeConfidence * 100));
        setLoading(false);

        // Save to cache
        await saveEntry(cacheKey, {
          title,
          summary: text,
          confidence: safeConfidence,
          timestamp: Date.now(),
        });

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
  }, [nodeId, nodeLabel, addFeedback, getEntry, saveEntry, loadCache]);

  const confidenceTone =
    confidencePercent >= 90
      ? "text-emerald-400"
      : confidencePercent >= 80
      ? "text-yellow-400"
      : "text-orange-400";

  // Focus trap: Keep focus within dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Focus close button on mount
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Simple focus trap: if Tab is pressed, cycle through focusable elements
      if (e.key === "Tab") {
        const focusableElements = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift+Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md motion-soft"
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduced ? { opacity: 1 } : { opacity: 0 }}
      transition={reduced ? { duration: 0 } : { duration: 0.3 }}
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="explain-title"
        className="relative w-[420px] rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl motion-soft"
        initial={reduced ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={reduced ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-neutral-500 transition-colors hover:text-neutral-300"
          aria-label="Overlay schließen"
        >
          <X size={18} />
        </button>

        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="text-cyan-400" size={18} />
          <h3 id="explain-title" className="text-sm font-medium text-neutral-100">
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

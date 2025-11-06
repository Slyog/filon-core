"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { X, Sparkles, RefreshCw } from "lucide-react";
import { generateSummaryV2, getConfidenceColor } from "@/ai/summarizerCore";
import { useFeedbackStore } from "@/store/FeedbackStore";
import { useExplainCache } from "@/hooks/useExplainCache";
import { useExplainConfidenceColor } from "@/hooks/useExplainConfidenceColor";

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
  const { cachedSummary, setCache, clearCache } = useExplainCache(nodeId);
  const [summary, setSummary] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [fromCache, setFromCache] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const confidenceColor = useExplainConfidenceColor(confidence);

  const generateSummary = useCallback(async (forceRegenerate = false) => {
    if (!nodeId) {
      setError("Kein Node ausgewählt.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      
      const content = nodeLabel?.trim() || "Unbenannter Gedanke";
      
      // Check cache first (unless forcing regenerate)
      if (!forceRegenerate && cachedSummary) {
        if (cancelled) return;
        console.info("ExplainCache hit", nodeId);
        setSummary(cachedSummary);
        setConfidence(0.9); // Default confidence for cached entries
        setFromCache(true);
        setLoading(false);
        return;
      }

      // Clear cache if regenerating
      if (forceRegenerate) {
        clearCache();
      }

      try {
        const result = await generateSummaryV2(nodeId, content);
        if (cancelled) return;

        const safeConfidence = Math.max(0, Math.min(1, result.confidence));
        setSummary(result.text);
        setConfidence(safeConfidence);
        setFromCache(result.fromCache || false);
        setLoading(false);

        // Update cache after successful generation
        if (!result.fromCache) {
          setCache(result.text);
        }

        addFeedback({
          type: "ai_summary_v2",
          payload: {
            message: result.text,
            nodeId,
            confidence: safeConfidence,
          },
          nodeId,
          message: result.text,
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
  }, [nodeId, nodeLabel, addFeedback, cachedSummary, setCache, clearCache]);

  useEffect(() => {
    generateSummary(false);
  }, [generateSummary]); // Regenerate when nodeId/nodeLabel changes (via generateSummary dependency)

  const confidencePercent = Math.round(confidence * 100);

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
      transition={reduced ? { duration: 0 } : { duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
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
        transition={reduced ? { duration: 0 } : { duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        data-test="explain-overlay"
        data-conf={confidence}
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
          <div className="space-y-3">
            {/* Shimmer placeholder while summary loads */}
            <div className="space-y-2">
              <div className="h-4 bg-neutral-800 rounded animate-pulse" />
              <div className="h-4 bg-neutral-800 rounded animate-pulse w-3/4" />
            </div>
            <div className="text-sm text-neutral-500">
              {typeof navigator !== "undefined" && !navigator.onLine
                ? "Waiting for connection…"
                : "Generiere Zusammenfassung…"}
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-orange-400" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && summary && (
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0 }}
            transition={reduced ? { duration: 0 } : { duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
            className="space-y-4 text-sm text-neutral-200"
          >
            <p>{summary}</p>
            
            {/* Confidence Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Confidence</span>
                <span className={`font-medium ${
                  confidenceColor === "emerald-400" ? "text-emerald-400" :
                  confidenceColor === "yellow-400" ? "text-yellow-400" :
                  "text-orange-400"
                }`}>
                  {confidencePercent}%
                </span>
              </div>
              <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${
                    confidenceColor === "emerald-400" ? "bg-emerald-400" :
                    confidenceColor === "yellow-400" ? "bg-yellow-400" :
                    "bg-orange-400"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${confidencePercent}%` }}
                  transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                />
              </div>
            </div>

            {/* Offline badge */}
            {fromCache && (
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-400">
                  Offline (cached)
                </span>
              </div>
            )}

            {/* Regenerate button */}
            <button
              type="button"
              onClick={() => generateSummary(true)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-neutral-800 text-xs text-neutral-300 hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Regenerate
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

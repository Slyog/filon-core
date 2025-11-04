"use client";

import { useState, useEffect, useRef } from "react";
import { exportGraph } from "@/utils/exportGraph";
import { logSuccess, logError } from "@/utils/qaLogger";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

export default function ExportDialog({
  isOpen,
  onClose,
  sessionId,
}: ExportDialogProps) {
  const [format, setFormat] = useState<"json" | "markdown">("json");
  const [busy, setBusy] = useState(false);
  const [manualSessionId, setManualSessionId] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setBusy(false);
      setManualSessionId("");
      // Focus first element when dialog opens
      setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, busy, onClose]);

  // Focus trap: prevent focus from leaving dialog
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    dialog.addEventListener("keydown", handleTab);
    return () => dialog.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) return null;

  const handleExport = async () => {
    const finalSessionId = sessionId || manualSessionId.trim();
    if (!finalSessionId) {
      logError({
        step: "export",
        notes: "Export failed: No session ID provided",
      });
      alert("Bitte geben Sie eine Session-ID ein.");
      return;
    }

    setBusy(true);

    try {
      const { filename, blob } = await exportGraph(finalSessionId, format);

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log success
      logSuccess({
        step: "export",
        notes: `Export successful: ${filename}`,
        meta: { sessionId: finalSessionId, format },
      });

      // Small visual confirmation (optional)
      // Could show a toast here, but for now just close after a brief delay
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown export error";
      console.error("Export error:", err);

      logError({
        step: "export",
        notes: `Export failed: ${errorMessage}`,
        meta: { sessionId: finalSessionId, format, error: String(err) },
      });

      alert(`Export fehlgeschlagen: ${errorMessage}`);
      setBusy(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !busy) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
    >
      <div
        ref={dialogRef}
        className="max-w-md w-full mx-4 rounded-xl p-6 bg-neutral-900 border border-neutral-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <h2
          id="export-dialog-title"
          className="text-xl font-semibold text-white mb-4"
        >
          Exportieren
        </h2>

        <div className="space-y-4">
          {/* Format Selection */}
          <div>
            <label
              htmlFor="format-select"
              className="block text-sm font-medium text-neutral-300 mb-2"
            >
              Format
            </label>
            <select
              id="format-select"
              value={format}
              onChange={(e) => setFormat(e.target.value as "json" | "markdown")}
              disabled={busy}
              className="w-full px-3 py-2 bg-neutral-800 text-neutral-200 rounded-lg border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="json">JSON</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>

          {/* Session ID Input (if not provided) */}
          {!sessionId && (
            <div>
              <label
                htmlFor="session-id-input"
                className="block text-sm font-medium text-neutral-300 mb-2"
              >
                Session ID
              </label>
              <input
                id="session-id-input"
                type="text"
                value={manualSessionId}
                onChange={(e) => setManualSessionId(e.target.value)}
                disabled={busy}
                placeholder="Session-ID eingeben..."
                className="w-full px-3 py-2 bg-neutral-800 text-neutral-200 rounded-lg border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-neutral-500"
                autoFocus
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              ref={firstFocusableRef}
              onClick={handleExport}
              disabled={busy || (!sessionId && !manualSessionId.trim())}
              className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
            >
              {busy ? "Exportiere..." : "Export"}
            </button>
            <button
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-200 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 focus:ring-offset-neutral-900"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

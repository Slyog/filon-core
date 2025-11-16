"use client";

import { useState, useEffect, useCallback } from "react";
import { loadCanvasSession } from "@/lib/session";

export type SessionStatus = "idle" | "saving" | "saved" | "error";

export interface UseSessionStatusReturn {
  status: SessionStatus;
  hasPendingChanges: boolean;
  lastSavedAt: number | null;
  saveNow: () => Promise<void>;
  error: string | null;
}

// Global ref to store the forceSync function from useAutosaveQueue
// This allows Brainbar to trigger manual saves without direct access to the hook
let globalForceSyncRef: (() => void) | null = null;

export function setGlobalForceSync(fn: (() => void) | null) {
  globalForceSyncRef = fn;
}

/**
 * Hook for session status that can be used in Brainbar
 * Reads from sessionStorage and provides status information
 */
export function useSessionStatus(): UseSessionStatusReturn {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check session status periodically
  useEffect(() => {
    const checkStatus = () => {
      try {
        const session = loadCanvasSession();
        if (session) {
          setHasPendingChanges(session.dirty);
          setLastSavedAt(session.updatedAt);
          
          // Update status based on session state and current status
          // If status is "saving", don't override it (wait for success/error event)
          if (status === "saving") {
            // Keep saving state, wait for event
            return;
          }
          
          // If there's a dirty session and we're not saving, show "idle" (unsaved changes)
          if (session.dirty) {
            setStatus("idle");
          } else {
            // Session is clean, show "saved"
            setStatus("saved");
          }
        } else {
          setHasPendingChanges(false);
          setLastSavedAt(null);
          if (status !== "saving") {
            setStatus("idle");
          }
        }
      } catch (err) {
        console.warn("[SessionStatus] Failed to check status:", err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, [status]);

  // Listen for autosave events from useCanvasAutosave and useAutosaveQueue
  useEffect(() => {
    const handleAutosaveStart = () => {
      setStatus("saving");
      setError(null);
    };

    const handleAutosaveSuccess = () => {
      // On success, check the actual session state
      // The session might still be marked as dirty (for backend sync),
      // but we show "saved" to indicate local save succeeded
      setStatus("saved");
      setError(null);
      // Update hasPendingChanges based on actual session state
      const session = loadCanvasSession();
      setHasPendingChanges(session?.dirty ?? false);
      setLastSavedAt(session?.updatedAt ?? Date.now());
    };

    const handleAutosaveError = (event: CustomEvent<{ error: string }>) => {
      setStatus("error");
      setError(event.detail.error);
      // Keep hasPendingChanges true on error
      const session = loadCanvasSession();
      setHasPendingChanges(session?.dirty ?? true);
    };

    window.addEventListener("autosave:start", handleAutosaveStart as EventListener);
    window.addEventListener("autosave:success", handleAutosaveSuccess as EventListener);
    window.addEventListener("autosave:error", handleAutosaveError as EventListener);

    return () => {
      window.removeEventListener("autosave:start", handleAutosaveStart as EventListener);
      window.removeEventListener("autosave:success", handleAutosaveSuccess as EventListener);
      window.removeEventListener("autosave:error", handleAutosaveError as EventListener);
    };
  }, []);

  const saveNow = useCallback(async () => {
    if (globalForceSyncRef) {
      try {
        setStatus("saving");
        setError(null);
        globalForceSyncRef();
        // The status will be updated via events
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setStatus("error");
        setError(errorMessage);
      }
    } else {
      // If no forceSync is available, just mark as saved (local save only)
      setStatus("saving");
      setTimeout(() => {
        setStatus("saved");
        setHasPendingChanges(false);
        setLastSavedAt(Date.now());
      }, 300);
    }
  }, []);

  return {
    status,
    hasPendingChanges,
    lastSavedAt,
    saveNow,
    error,
  };
}


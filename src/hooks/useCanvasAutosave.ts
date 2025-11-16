"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { saveCanvasSession } from "@/lib/session";
import type { Node, Edge } from "reactflow";

export interface CanvasAutosaveData {
  nodes: Node[];
  edges: Edge[];
  presetId?: string | null;
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  metadata?: Record<string, unknown>;
}

const DEFAULT_THROTTLE_MS = 400;

/**
 * Autosave hook for canvas state
 * Detects changes in nodes, edges, and metadata
 * Throttled save (300-500ms) to sessionStorage
 * Marks state as "unsaved" internally until saved
 */
export function useCanvasAutosave(
  data: CanvasAutosaveData,
  throttleMs: number = DEFAULT_THROTTLE_MS
): { hasUnsavedChanges: boolean } {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Serialize data for comparison
  const serializeData = useCallback((d: CanvasAutosaveData): string => {
    return JSON.stringify({
      nodes: d.nodes,
      edges: d.edges,
      presetId: d.presetId,
      viewport: d.viewport,
      metadata: d.metadata,
    });
  }, []);

  // Throttled save function
  const performSave = useCallback(
    (toSave: CanvasAutosaveData) => {
      try {
        // Emit autosave start event for useSessionStatus
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("autosave:start"));
        }

        // Save nodes, edges, and presetId
        // Note: viewport is not saved in CanvasSessionState interface
        // Mark as clean (dirty: false) after successful autosave
        saveCanvasSession(
          {
            nodes: toSave.nodes,
            edges: toSave.edges,
            presetId: toSave.presetId,
            metadata: toSave.metadata,
          },
          false // dirty: false - session is clean after autosave
        );
        const serialized = serializeData(toSave);
        lastSavedRef.current = serialized;
        setHasUnsavedChanges(false);

        // Emit autosave success event for useSessionStatus
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("autosave:success"));
        }
      } catch (error) {
        console.warn("[CanvasAutosave] Failed to save:", error);
        // Keep unsaved state on error
        
        // Emit autosave error event
        if (typeof window !== "undefined") {
          const errorMessage = error instanceof Error ? error.message : String(error);
          window.dispatchEvent(
            new CustomEvent("autosave:error", {
              detail: { error: errorMessage },
            })
          );
        }
      }
    },
    [serializeData]
  );

  // Effect to detect changes and trigger throttled save
  useEffect(() => {
    const serialized = serializeData(data);

    // Skip if no changes
    if (serialized === lastSavedRef.current) {
      return;
    }

    // Mark as unsaved
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasUnsavedChanges(true);

    // Mark session as dirty immediately when changes are detected
    // This ensures that if the user reloads before autosave completes,
    // the session is marked as dirty and the restore toast will show
    try {
      saveCanvasSession(
        {
          nodes: data.nodes,
          edges: data.edges,
          presetId: data.presetId,
          metadata: data.metadata,
        },
        true // dirty: true - mark as dirty until autosave completes
      );
    } catch (error) {
      console.warn("[CanvasAutosave] Failed to mark session as dirty:", error);
    }

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new timer for throttled save
    timerRef.current = setTimeout(() => {
      performSave(data);
      timerRef.current = null;
    }, throttleMs);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [data, serializeData, performSave, throttleMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    hasUnsavedChanges,
  };
}


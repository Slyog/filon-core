"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { saveCanvasSession } from "@/lib/session";
import type { Node, Edge } from "reactflow";

export interface CanvasAutosaveData {
  nodes: Node[];
  edges: Edge[];
  presetId?: string | null;
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
      metadata: d.metadata,
    });
  }, []);

  // Throttled save function
  const performSave = useCallback(
    (toSave: CanvasAutosaveData) => {
      try {
        saveCanvasSession({
          nodes: toSave.nodes,
          edges: toSave.edges,
          presetId: toSave.presetId,
          metadata: toSave.metadata,
        });
        const serialized = serializeData(toSave);
        lastSavedRef.current = serialized;
        setHasUnsavedChanges(false);
      } catch (error) {
        console.warn("[CanvasAutosave] Failed to save:", error);
        // Keep unsaved state on error
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


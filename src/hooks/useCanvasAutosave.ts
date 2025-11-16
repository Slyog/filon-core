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

const DEFAULT_THROTTLE_MS = 600;

// TEMP debug helper for autosave logs (controlled by window.__FILON_SESSION_DEBUG__)
function autosaveDebug(...args: unknown[]) {
  if (typeof window === "undefined") return;
  if ((window as any).__FILON_SESSION_DEBUG__ === true) {
    console.debug("[SessionDebug] useCanvasAutosave", ...args);
  }
}

/**
 * Autosave hook for canvas state
 * Detects changes in nodes, edges, and metadata
 * Throttled save (300-500ms) to sessionStorage
 * Marks state as "unsaved" internally until saved
 */
export function useCanvasAutosave(
  data: CanvasAutosaveData,
  throttleMs: number = DEFAULT_THROTTLE_MS
): { hasUnsavedChanges: boolean; isSaving: boolean } {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const hasInteractedRef = useRef(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const serializeData = useCallback((d: CanvasAutosaveData): string => {
    return JSON.stringify({
      nodes: d.nodes,
      edges: d.edges,
      presetId: d.presetId ?? null,
      metadata: d.metadata,
    });
  }, []);

  useEffect(() => {
    lastSavedRef.current = serializeData(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const serialized = serializeData(data);

    if (lastSavedRef.current === null) {
      lastSavedRef.current = serialized;
      return;
    }

    if (serialized === lastSavedRef.current) {
      return;
    }

    hasInteractedRef.current = true;

    autosaveDebug("change detected", {
      nodes: data.nodes.length,
      edges: data.edges.length,
      presetId: data.presetId ?? null,
    });

    setHasUnsavedChanges(true);
    setIsSaving(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("autosave:start"));
    }

    const markDirty = () => {
      try {
        saveCanvasSession(
          {
            nodes: data.nodes,
            edges: data.edges,
            presetId: data.presetId ?? null,
            metadata: data.metadata,
          },
          true
        );
      } catch (error) {
        console.warn("[CanvasAutosave] Failed to mark session dirty:", error);
      }
    };

    const writeClean = () => {
      try {
        autosaveDebug("performSave", {
          nodes: data.nodes.length,
          edges: data.edges.length,
          presetId: data.presetId ?? null,
        });

        saveCanvasSession(
          {
            nodes: data.nodes,
            edges: data.edges,
            presetId: data.presetId ?? null,
            metadata: data.metadata,
          },
          false
        );
        lastSavedRef.current = serialized;
        setHasUnsavedChanges(false);
        setIsSaving(false);

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("autosave:success"));
        }
      } catch (error) {
        console.warn("[CanvasAutosave] Failed to save:", error);
        setIsSaving(false);
        if (typeof window !== "undefined") {
          const errorMessage = error instanceof Error ? error.message : String(error);
          window.dispatchEvent(
            new CustomEvent("autosave:error", { detail: { error: errorMessage } })
          );
        }
      }
    };

    markDirty();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      writeClean();
      timerRef.current = null;
    }, throttleMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [data, serializeData, throttleMs]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setIsSaving(false);
    };
  }, []);

  return { hasUnsavedChanges, isSaving };
}


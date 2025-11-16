"use client";

import { useEffect, useRef } from "react";
import type { Node, Edge } from "reactflow";
import type { OnboardingPresetId } from "@/components/onboarding/OnboardingPresetPanel";
import {
  saveSimpleCanvasSnapshot,
  type SimpleCanvasSnapshot,
} from "@/lib/simpleCanvasSession";

type AutosaveArgs = {
  nodes: Node[];
  edges: Edge[];
  presetId: OnboardingPresetId | null;
  enabled: boolean;
  delay?: number;
};

export function useSimpleCanvasAutosave({
  nodes,
  edges,
  presetId,
  enabled,
  delay = 800,
}: AutosaveArgs) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSerializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const snapshot: SimpleCanvasSnapshot = {
      version: 1,
      nodes,
      edges,
      presetId,
    };

    const serialized = JSON.stringify(snapshot);
    if (serialized === lastSerializedRef.current) {
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      saveSimpleCanvasSnapshot(snapshot);
      lastSerializedRef.current = serialized;
      timerRef.current = null;
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [nodes, edges, presetId, enabled, delay]);
}


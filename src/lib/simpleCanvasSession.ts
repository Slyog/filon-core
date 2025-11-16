"use client";

import type { Node, Edge } from "reactflow";
import type { OnboardingPresetId } from "@/components/onboarding/OnboardingPresetPanel";

export type SimpleCanvasSnapshot = {
  version: 1;
  nodes: Node[];
  edges: Edge[];
  presetId: OnboardingPresetId | null;
};

const STORAGE_KEY = "filon.v4.canvas.state";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadSimpleCanvasSnapshot(): SimpleCanvasSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const snapshot = safeParse<SimpleCanvasSnapshot>(window.sessionStorage.getItem(STORAGE_KEY));
  if (!snapshot) return null;
  if (snapshot.version !== 1) return null;
  if (!Array.isArray(snapshot.nodes) || !Array.isArray(snapshot.edges)) {
    return null;
  }

  return {
    version: 1,
    nodes: snapshot.nodes as Node[],
    edges: snapshot.edges as Edge[],
    presetId: snapshot.presetId ?? null,
  };
}

export function saveSimpleCanvasSnapshot(snapshot: SimpleCanvasSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore quota errors
  }
}

export function clearSimpleCanvasSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}


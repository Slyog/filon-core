"use client";

const CANVAS_STORAGE_KEY = "filon.v4.canvas.state";

export interface CanvasSessionState {
  version: 1;
  savedAt: number;
  updatedAt: number;
  dirty: boolean;
  nodes: unknown[];
  edges: unknown[];
  presetId?: string | null;
  metadata?: Record<string, unknown>;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeSnapshot(snapshot: CanvasSessionState): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore quota/private-mode errors
  }
}

export function saveCanvasSession(
  state: Omit<CanvasSessionState, "version" | "savedAt" | "updatedAt" | "dirty">,
  dirty: boolean
): void {
  if (typeof window === "undefined") return;

  const now = Date.now();
  const existing = safeParse<CanvasSessionState>(
    window.sessionStorage.getItem(CANVAS_STORAGE_KEY)
  );
  const savedAt = existing?.savedAt ?? now;

  const snapshot: CanvasSessionState = {
    version: 1,
    savedAt,
    updatedAt: now,
    dirty,
    nodes: state.nodes,
    edges: state.edges,
    presetId: state.presetId ?? null,
    metadata: state.metadata,
  };

  writeSnapshot(snapshot);
}

export function loadCanvasSession(): CanvasSessionState | null {
  if (typeof window === "undefined") return null;

  const parsed = safeParse<CanvasSessionState>(
    window.sessionStorage.getItem(CANVAS_STORAGE_KEY)
  );
  if (!parsed) return null;
  if (parsed.version !== 1) return null;
  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    return null;
  }

  return parsed;
}

export function clearCanvasSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(CANVAS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasDirtySession(): boolean {
  const session = loadCanvasSession();
  return Boolean(session && session.dirty === true);
}

export function markSessionClean(): void {
  const session = loadCanvasSession();
  if (!session) return;

  const snapshot: CanvasSessionState = {
    ...session,
    dirty: false,
    updatedAt: Date.now(),
  };

  writeSnapshot(snapshot);
}

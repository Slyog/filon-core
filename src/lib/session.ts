/**
 * Simple sessionStorage wrapper for canvas state
 * Used for temporary autosave/restore functionality
 */

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

/**
 * Save canvas state to sessionStorage
 * Always marks as dirty and updates updatedAt timestamp
 */
export function saveCanvasSession(state: Omit<CanvasSessionState, "version" | "savedAt" | "updatedAt" | "dirty">): void {
  if (typeof window === "undefined") return;

  try {
    const now = Date.now();
    const sessionState: CanvasSessionState = {
      version: 1,
      savedAt: now,
      updatedAt: now,
      dirty: true,
      ...state,
    };
    window.sessionStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(sessionState));
  } catch (error) {
    // sessionStorage may be full or unavailable (private browsing, etc.)
    console.warn("[Session] Failed to save canvas state:", error);
  }
}

/**
 * Mark the current session as clean (not dirty)
 * Call this after a successful manual save to prevent toast from showing
 */
export function markSessionClean(): void {
  if (typeof window === "undefined") return;

  try {
    const existing = loadCanvasSession();
    if (existing) {
      const cleanState: CanvasSessionState = {
        ...existing,
        dirty: false,
        updatedAt: Date.now(),
      };
      window.sessionStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(cleanState));
    }
  } catch (error) {
    console.warn("[Session] Failed to mark session as clean:", error);
  }
}

/**
 * Load canvas state from sessionStorage
 * @returns Canvas state or null if not found/invalid
 */
export function loadCanvasSession(): CanvasSessionState | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.sessionStorage.getItem(CANVAS_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as CanvasSessionState;

    // Validate version
    if (parsed.version !== 1) {
      console.warn(`[Session] Unsupported canvas state version: ${parsed.version}`);
      return null;
    }

    // Validate required fields
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      console.warn("[Session] Invalid canvas state: nodes and edges must be arrays");
      return null;
    }

    // Migrate old sessions that don't have dirty/updatedAt fields
    if (typeof parsed.dirty !== "boolean") {
      parsed.dirty = true; // Assume old sessions are dirty
    }
    if (typeof parsed.updatedAt !== "number") {
      parsed.updatedAt = parsed.savedAt; // Fallback to savedAt
    }

    return parsed;
  } catch (error) {
    console.warn("[Session] Failed to load canvas state:", error);
    return null;
  }
}

/**
 * Clear canvas state from sessionStorage
 */
export function clearCanvasSession(): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(CANVAS_STORAGE_KEY);
  } catch (error) {
    console.warn("[Session] Failed to clear canvas state:", error);
  }
}

/**
 * Check if canvas state exists in sessionStorage
 */
export function hasCanvasSession(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return window.sessionStorage.getItem(CANVAS_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/**
 * Check if there is a dirty (unsaved) session that should trigger the restore toast
 */
export function hasDirtySession(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const session = loadCanvasSession();
    return session !== null && session.dirty === true;
  } catch {
    return false;
  }
}


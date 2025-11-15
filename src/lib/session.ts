/**
 * Simple sessionStorage wrapper for canvas state
 * Used for temporary autosave/restore functionality
 */

const CANVAS_STORAGE_KEY = "filon.v4.canvas.state";

export interface CanvasSessionState {
  version: 1;
  savedAt: number;
  nodes: unknown[];
  edges: unknown[];
  presetId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Save canvas state to sessionStorage
 */
export function saveCanvasSession(state: Omit<CanvasSessionState, "version" | "savedAt">): void {
  if (typeof window === "undefined") return;

  try {
    const sessionState: CanvasSessionState = {
      version: 1,
      savedAt: Date.now(),
      ...state,
    };
    window.sessionStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(sessionState));
  } catch (error) {
    // sessionStorage may be full or unavailable (private browsing, etc.)
    console.warn("[Session] Failed to save canvas state:", error);
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


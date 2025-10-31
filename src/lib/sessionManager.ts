import localforage from "localforage";
import type { Node, Edge } from "reactflow";

export interface GraphState {
  nodes: Node[];
  edges: Edge[];
  meta?: {
    lastSavedAt?: number;
    version?: string;
  };
}

export interface SessionData {
  activeId: string | null;
  panel: boolean;
  timestamp?: number;
}

const SESSION_KEY = "filon-session";
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Saves session data including active node and panel state
 * @param data - Session data to save (activeId and panel state)
 */
export async function saveSession(data: SessionData): Promise<void> {
  try {
    const sessionWithTimestamp = {
      ...data,
      timestamp: Date.now(),
    };
    await localforage.setItem(SESSION_KEY, sessionWithTimestamp);
  } catch (err) {
    console.error("Failed to save session:", err);
  }
}

/**
 * Loads session data if it exists and is not expired
 * @returns Session data or null if not found/expired
 */
export async function loadSession(): Promise<SessionData | null> {
  try {
    const session = await localforage.getItem<SessionData>(SESSION_KEY);
    if (!session) return null;

    // Check TTL if timestamp exists
    if (session.timestamp) {
      const age = Date.now() - session.timestamp;
      if (age > SESSION_TTL) {
        console.log("Session expired, clearing...");
        await clearSession();
        return null;
      }
    }

    return {
      activeId: session.activeId ?? null,
      panel: session.panel ?? false,
      timestamp: session.timestamp,
    };
  } catch (err) {
    console.error("Failed to load session:", err);
    return null;
  }
}

/**
 * Clears the session data from storage
 */
export async function clearSession(): Promise<void> {
  try {
    await localforage.removeItem(SESSION_KEY);
  } catch (err) {
    console.error("Failed to clear session:", err);
  }
}

/**
 * Saves graph state to persistent storage
 * @param data - Graph state (nodes and edges)
 */
export async function saveGraphState(data: GraphState): Promise<void> {
  try {
    const stateWithMeta = {
      ...data,
      meta: {
        ...data.meta,
        lastSavedAt: Date.now(),
        version: "1.0",
      },
    };
    await localforage.setItem("filon-graph-state", stateWithMeta);
  } catch (err) {
    console.error("Failed to save graph state:", err);
  }
}

/**
 * Loads graph state from persistent storage
 * @returns Graph state or null if not found
 */
export async function loadGraphState(): Promise<GraphState | null> {
  try {
    const state = await localforage.getItem<GraphState>("filon-graph-state");
    return state;
  } catch (err) {
    console.error("Failed to load graph state:", err);
    return null;
  }
}

/**
 * Clears graph state from storage
 */
export async function clearGraphState(): Promise<void> {
  try {
    await localforage.removeItem("filon-graph-state");
  } catch (err) {
    console.error("Failed to clear graph state:", err);
  }
}

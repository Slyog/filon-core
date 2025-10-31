import localforage from "localforage";

export interface FeedbackEvent {
  id: string;
  timestamp: number;
  type: string; // "save", "error", "snapshot", "restore", "delete", "rename", etc.
  details: Record<string, any>;
  success: boolean;
  duration?: number; // in milliseconds
}

const FEEDBACK_KEYSPACE = "filon_feedback_v1";
const FEEDBACK_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Adds a new feedback event to the store
 * @param event - Event to add (id will be auto-generated if not provided)
 * @returns The created event with ID
 */
export async function addFeedbackEvent(
  event: Omit<FeedbackEvent, "id">
): Promise<FeedbackEvent> {
  try {
    const fullEvent: FeedbackEvent = {
      ...event,
      id: crypto.randomUUID(),
    };

    const eventList = await localforage.getItem<FeedbackEvent[]>(
      FEEDBACK_KEYSPACE
    );
    const updatedList = eventList ? [fullEvent, ...eventList] : [fullEvent];

    await localforage.setItem(FEEDBACK_KEYSPACE, updatedList);

    console.log(
      `📊 Feedback logged: ${event.type} (success: ${event.success})`
    );

    return fullEvent;
  } catch (err) {
    console.warn("Failed to add feedback event:", err);
    return { ...event, id: crypto.randomUUID() };
  }
}

/**
 * Lists all feedback events, optionally limited
 * @param limit - Optional maximum number of events to return
 * @param filterType - Optional type filter
 * @returns Array of feedback events
 */
export async function listFeedbackEvents(
  limit?: number,
  filterType?: string
): Promise<FeedbackEvent[]> {
  try {
    let eventList = await localforage.getItem<FeedbackEvent[]>(
      FEEDBACK_KEYSPACE
    );
    if (!eventList) return [];

    // Filter by type if specified
    if (filterType) {
      eventList = eventList.filter((e) => e.type === filterType);
    }

    // Apply limit if specified
    return limit ? eventList.slice(0, limit) : eventList;
  } catch (err) {
    console.warn("Failed to list feedback events:", err);
    return [];
  }
}

/**
 * Analyzes feedback events and returns aggregated statistics
 * @param timeWindow - Optional time window in milliseconds (default: last 24h)
 * @returns Analysis results with patterns and statistics
 */
export async function analyzeFeedback(timeWindow?: number): Promise<{
  totalEvents: number;
  successRate: number;
  eventTypes: Record<string, number>;
  avgDuration?: number;
  patterns: string[];
}> {
  try {
    const window = timeWindow || 24 * 60 * 60 * 1000; // Default: 24h
    const cutoff = Date.now() - window;

    const allEvents = await listFeedbackEvents();
    const recentEvents = allEvents.filter((e) => e.timestamp >= cutoff);

    if (recentEvents.length === 0) {
      return {
        totalEvents: 0,
        successRate: 0,
        eventTypes: {},
        patterns: [],
      };
    }

    // Count successes
    const successes = recentEvents.filter((e) => e.success).length;
    const successRate = successes / recentEvents.length;

    // Count event types
    const eventTypes: Record<string, number> = {};
    recentEvents.forEach((e) => {
      eventTypes[e.type] = (eventTypes[e.type] || 0) + 1;
    });

    // Calculate average duration (if available)
    const eventsWithDuration = recentEvents.filter(
      (e) => e.duration !== undefined
    );
    const avgDuration =
      eventsWithDuration.length > 0
        ? eventsWithDuration.reduce((sum, e) => sum + (e.duration || 0), 0) /
          eventsWithDuration.length
        : undefined;

    // Identify patterns
    const patterns: string[] = [];

    // Pattern 1: Frequent saves
    if (eventTypes["save"] >= 10) {
      patterns.push("frequent_saves");
    }

    // Pattern 2: High error rate
    if (successRate < 0.7 && recentEvents.length >= 5) {
      patterns.push("high_error_rate");
    }

    // Pattern 3: Frequent snapshots
    if (eventTypes["snapshot"] >= 5) {
      patterns.push("frequent_snapshots");
    }

    // Pattern 4: Many restores
    if (eventTypes["restore"] >= 3) {
      patterns.push("many_restores");
    }

    return {
      totalEvents: recentEvents.length,
      successRate,
      eventTypes,
      avgDuration,
      patterns,
    };
  } catch (err) {
    console.warn("Failed to analyze feedback:", err);
    return {
      totalEvents: 0,
      successRate: 0,
      eventTypes: {},
      patterns: [],
    };
  }
}

/**
 * Cleans up feedback events older than the TTL
 */
export async function cleanupOldFeedback(): Promise<void> {
  try {
    const cutoff = Date.now() - FEEDBACK_TTL;
    const allEvents = await listFeedbackEvents();
    const recentEvents = allEvents.filter((e) => e.timestamp >= cutoff);

    await localforage.setItem(FEEDBACK_KEYSPACE, recentEvents);

    const removed = allEvents.length - recentEvents.length;
    if (removed > 0) {
      console.log(`🗑️ Cleaned up ${removed} old feedback events`);
    }
  } catch (err) {
    console.warn("Failed to cleanup old feedback:", err);
  }
}

/**
 * Simple text-based feedback analysis (alternative interface)
 * Returns human-readable insights
 */
export async function analyzeFeedbackText(): Promise<string | null> {
  try {
    const events = await listFeedbackEvents(50);
    const now = Date.now();

    // Count event types
    const saves = events.filter((e) => e.type === "save");
    const errors = events.filter((e) => e.type === "error");
    const snapshots = events.filter((e) => e.type === "snapshot");
    const restores = events.filter((e) => e.type === "restore");

    // Check for recent patterns (last 3 minutes)
    const recentSaves = saves.filter((e) => now - e.timestamp < 3 * 60 * 1000);
    const recentErrors = errors.filter(
      (e) => now - e.timestamp < 10 * 60 * 1000
    );

    // Generate insights
    if (recentSaves.length > 5) {
      return "Du speicherst sehr häufig – möchtest du das Autosave-Intervall anpassen?";
    }

    if (recentErrors.length > 3) {
      return "Mehrere Fehlversuche erkannt – prüfe Undo- oder Retry-Funktion.";
    }

    if (snapshots.length > 0) {
      const recentSnapshots = snapshots.filter(
        (e) => now - e.timestamp < 1 * 60 * 60 * 1000
      );
      if (recentSnapshots.length > 5) {
        return "Viele Snapshots erstellt – deine Ideen entwickeln sich schnell!";
      }
    }

    if (restores.length >= 3) {
      return "Du stellst häufig alte Zustände wieder her – soll ich dir die Version-Historie zeigen?";
    }

    return null;
  } catch (err) {
    console.warn("Failed to analyze feedback:", err);
    return null;
  }
}

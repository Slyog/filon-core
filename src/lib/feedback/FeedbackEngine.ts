import {
  analyzeFeedback,
  analyzeFeedbackText,
  addFeedbackEvent,
} from "./FeedbackStore";

export interface Insight {
  message: string;
  pattern: string;
  priority: "low" | "medium" | "high";
}

/**
 * Generates insights based on feedback analysis
 * @param timeWindow - Optional time window in milliseconds (default: last 24h)
 * @returns Array of insights, sorted by priority
 */
export async function generateInsights(
  timeWindow?: number
): Promise<Insight[]> {
  const insights: Insight[] = [];

  const analysis = await analyzeFeedback(timeWindow);

  // No insights if no events
  if (analysis.totalEvents === 0) {
    return [];
  }

  // Pattern-based insights
  for (const pattern of analysis.patterns) {
    switch (pattern) {
      case "frequent_saves":
        insights.push({
          message:
            "Du speicherst häufig kurz nacheinander – möchtest du das Autosave-Intervall anpassen?",
          pattern: "frequent_saves",
          priority: "medium",
        });
        break;

      case "high_error_rate":
        insights.push({
          message: `Hohe Fehlerrate (${Math.round(
            (1 - analysis.successRate) * 100
          )}%) – soll ich dir helfen, die Ursache zu finden?`,
          pattern: "high_error_rate",
          priority: "high",
        });
        break;

      case "frequent_snapshots":
        insights.push({
          message:
            "Viele Snapshots erstellt – deine Ideen scheinen sich schnell zu entwickeln! 🌱",
          pattern: "frequent_snapshots",
          priority: "low",
        });
        break;

      case "many_restores":
        insights.push({
          message:
            "Du stellst häufig alte Zustände wieder her – möchtest du eine Version-Historie sehen?",
          pattern: "many_restores",
          priority: "medium",
        });
        break;
    }
  }

  // Success rate insight
  if (analysis.successRate > 0.95 && analysis.totalEvents >= 10) {
    insights.push({
      message: "Ausgezeichnet! Dein Workflow läuft sehr stabil. 🎉",
      pattern: "high_success_rate",
      priority: "low",
    });
  }

  // Average duration insight
  if (analysis.avgDuration && analysis.avgDuration > 2000) {
    insights.push({
      message:
        "Operationen dauern länger als gewöhnlich – Performance-Check empfohlen.",
      pattern: "slow_operations",
      priority: "high",
    });
  }

  // Sort by priority: high -> medium -> low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return insights;
}

/**
 * Checks if user feedback should be shown based on rate limiting
 * @returns true if insights should be shown
 */
export async function shouldShowFeedback(): Promise<boolean> {
  const analysis = await analyzeFeedback(60 * 60 * 1000); // Last hour

  // Only show feedback if there's meaningful activity
  if (analysis.totalEvents < 3) {
    return false;
  }

  // Show feedback if there are high-priority patterns
  const insights = await generateInsights(60 * 60 * 1000);
  const hasHighPriority = insights.some((i) => i.priority === "high");

  return hasHighPriority || insights.length > 0;
}

/**
 * Gets the most relevant insight to display
 * @returns Insight message or null
 */
export async function getMostRelevantInsight(): Promise<string | null> {
  const insights = await generateInsights();

  if (insights.length === 0) {
    return null;
  }

  // Return the highest priority insight (already sorted)
  return insights[0].message;
}

/**
 * Simple alternative: generate feedback insight (text-only)
 * @returns Insight message or null
 */
export async function generateFeedbackInsight(): Promise<string | null> {
  const insight = await analyzeFeedbackText();
  if (insight) {
    console.log("📊 Insight generated:", insight);
  }
  return insight;
}

/**
 * Log an event and automatically analyze for insights
 * @param type - Event type
 * @param details - Event details (optional)
 * @param success - Whether the event succeeded
 * @param duration - Duration in milliseconds (optional)
 * @returns Generated insight or null
 */
export async function logEventAndAnalyze(
  type: string,
  details?: string,
  success = true,
  duration?: number
): Promise<string | null> {
  try {
    await addFeedbackEvent({
      timestamp: Date.now(),
      type,
      details: details ? { message: details } : {},
      success,
      duration,
    });

    const insight = await generateFeedbackInsight();
    return insight;
  } catch (err) {
    console.warn("Failed to log event and analyze:", err);
    return null;
  }
}

/**
 * Personalized Insights Generator (v0.3)
 * Generates actionable insights based on user behavior analysis
 */

import { generateLearningSummary } from "@/lib/ai/generateLearningSummary";
import { listFeedbackEvents } from "@/lib/feedback/FeedbackStore";
import { analyzePersonalizedInsights } from "./insightsAnalytics";

export interface Insight {
  id: string;
  category: "Productivity" | "Focus" | "Stability" | "Exploration";
  message: string;
  suggestion?: string;
  severity?: "info" | "warn" | "critical";
}

export async function generatePersonalizedInsights(): Promise<Insight[]> {
  const summary = await generateLearningSummary();
  const feedback = await listFeedbackEvents(50);

  const insights: Insight[] = [];

  // Analyze summary text for patterns
  if (summary?.includes("stabil & produktiv")) {
    insights.push({
      id: "consistency",
      category: "Productivity",
      message: "Du arbeitest sehr konsistent und produktiv.",
      suggestion: "Überlege, komplexere Aufgabenblöcke zu planen.",
      severity: "info",
    });
  }

  const errors = feedback.filter((f) => f.type === "error");
  if (errors.length > 3) {
    insights.push({
      id: "stability",
      category: "Stability",
      message: "Mehrere Fehlversuche erkannt.",
      suggestion: "Aktiviere Debug-Logs oder kürzere Autosave-Intervalle.",
      severity: "warn",
    });
  }

  const saves = feedback.filter((f) => f.type === "save");
  if (saves.length > 10) {
    insights.push({
      id: "focus",
      category: "Focus",
      message: "Sehr viele Saves in kurzer Zeit.",
      suggestion:
        "Möglicherweise arbeitest du iterativ – überlege, Fokus-Sessions zu bündeln.",
      severity: "info",
    });
  }

  // Use analytics engine for deeper insights
  const analytics = await analyzePersonalizedInsights();

  // Add sector-based insights
  analytics.sectors.forEach((sector) => {
    if (sector.score < 50) {
      insights.push({
        id: `sector-${sector.category.toLowerCase()}`,
        category: mapCategory(sector.category),
        message: `${sector.category}: Verbesserungspotenzial erkannt.`,
        suggestion: sector.recommendations[0],
        severity: "warn",
      });
    } else if (sector.score >= 80) {
      insights.push({
        id: `strength-${sector.category.toLowerCase()}`,
        category: mapCategory(sector.category),
        message: `${sector.category}: Starke Leistung!`,
        suggestion: "Weiter so!",
        severity: "info",
      });
    }
  });

  // Overall assessment
  if (analytics.overallScore < 50) {
    insights.unshift({
      id: "overall-improvement",
      category: "Exploration",
      message: "Dein Workflow könnte optimiert werden.",
      suggestion: "Nutze häufiger Branches und Snapshots für Experimente.",
      severity: "warn",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "neutral",
      category: "Exploration",
      message: "Keine signifikanten Trends erkannt.",
      suggestion: "Arbeite weiter und lass FILON dein Muster lernen.",
      severity: "info",
    });
  }

  return insights;
}

function mapCategory(category: string): Insight["category"] {
  switch (category) {
    case "Produktivität":
      return "Productivity";
    case "Fehlerverhalten":
      return "Stability";
    case "Fokusbalance":
      return "Focus";
    case "Rhythmus":
      return "Exploration";
    default:
      return "Exploration";
  }
}


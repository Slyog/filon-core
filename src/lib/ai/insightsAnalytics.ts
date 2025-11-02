/**
 * Insights Analytics Engine (v0.3)
 * Analyzes user behavior across multiple dimensions
 * Generates personalized recommendations
 */

import { listFeedbackEvents } from "@/lib/feedback/FeedbackStore";
import { listSnapshots } from "@/lib/versionManager";

export interface SectorAnalysis {
  category: string;
  score: number; // 0-100
  trend: "improving" | "stable" | "declining";
  insights: string[];
  recommendations: string[];
}

export interface PersonalizedInsights {
  overallScore: number;
  sectors: SectorAnalysis[];
  strengths: string[];
  improvements: string[];
  recentTrend: string;
}

/**
 * Analyzes user behavior across productivity, errors, focus, and rhythm
 * @param timeWindow - Analysis time window in milliseconds
 * @returns Complete insights analysis
 */
export async function analyzePersonalizedInsights(
  timeWindow?: number
): Promise<PersonalizedInsights> {
  const window = timeWindow || 7 * 24 * 60 * 60 * 1000; // Default: 7 days
  const cutoff = Date.now() - window;

  const allFeedback = await listFeedbackEvents(200);
  const allSnapshots = await listSnapshots();
  
  const recentFeedback = allFeedback.filter((e) => e.timestamp >= cutoff);
  const recentSnapshots = allSnapshots.filter((s) => s.timestamp >= cutoff);

  // Categorize events
  const saves = recentFeedback.filter((e) => e.type === "save");
  const errors = recentFeedback.filter((e) => e.type === "error");
  const restores = recentFeedback.filter((e) => e.type === "restore");
  const snapshots = recentFeedback.filter((e) => e.type === "snapshot");

  // Calculate scores for each sector (0-100)
  const productivityScore = calculateProductivityScore(saves, snapshots, errors);
  const errorScore = calculateErrorScore(errors, saves);
  const focusScore = calculateFocusScore(saves, restores);
  const rhythmScore = calculateRhythmScore(allFeedback.slice(0, 50));

  // Generate sector analyses
  const sectors: SectorAnalysis[] = [
    analyzeProductivity(productivityScore, saves, snapshots),
    analyzeErrorBehavior(errorScore, errors, saves),
    analyzeFocusBalance(focusScore, saves, restores),
    analyzeRhythm(rhythmScore, allFeedback.slice(0, 50)),
  ];

  // Overall score (weighted average)
  const overallScore = Math.round(
    (productivityScore * 0.3 +
      errorScore * 0.25 +
      focusScore * 0.25 +
      rhythmScore * 0.2)
  );

  // Identify strengths and improvements
  const strengths: string[] = [];
  const improvements: string[] = [];

  sectors.forEach((sector) => {
    if (sector.score >= 80) {
      strengths.push(sector.category);
    } else if (sector.score < 50) {
      improvements.push(sector.category);
    }
  });

  // Recent trend
  const recentTrend = analyzeRecentTrend(recentFeedback, recentSnapshots);

  return {
    overallScore,
    sectors,
    strengths,
    improvements,
    recentTrend,
  };
}

function calculateProductivityScore(
  saves: any[],
  snapshots: any[],
  errors: any[]
): number {
  if (saves.length === 0 && snapshots.length === 0) return 30;

  const saveCount = saves.length;
  const snapshotCount = snapshots.length;
  const errorRate = saves.length > 0 ? errors.length / saves.length : 0;

  let score = Math.min(50, saveCount * 2) + Math.min(30, snapshotCount * 6);
  score -= errorRate * 20;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateErrorScore(errors: any[], saves: any[]): number {
  if (saves.length === 0) return 100;

  const errorRate = errors.length / saves.length;
  const score = 100 - errorRate * 100;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateFocusScore(saves: any[], restores: any[]): number {
  if (saves.length === 0) return 50;

  const restoreRate = restores.length / saves.length;
  let score = 100 - restoreRate * 150;

  if (saves.length > 20) score += 10; // High activity = focused

  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateRhythmScore(events: any[]): number {
  if (events.length < 3) return 50;

  // Calculate time intervals between events
  const intervals: number[] = [];
  for (let i = 1; i < events.length; i++) {
    intervals.push(events[i].timestamp - events[i - 1].timestamp);
  }

  // Calculate coefficient of variation (lower = more consistent)
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance =
    intervals.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
    intervals.length;
  const stdDev = Math.sqrt(variance);
  const cv = avg > 0 ? stdDev / avg : 1;

  // Lower CV = higher score (more rhythmic)
  const score = Math.max(0, 100 - cv * 30);

  return Math.round(score);
}

function analyzeProductivity(
  score: number,
  saves: any[],
  snapshots: any[]
): SectorAnalysis {
  const insights: string[] = [];
  const recommendations: string[] = [];

  if (score >= 80) {
    insights.push("Deine Produktivität ist sehr hoch.");
    insights.push(`${saves.length} Saves und ${snapshots.length} Snapshots zeigen konstante Fortschritte.`);
  } else if (score >= 50) {
    insights.push("Moderate Produktivität erkannt.");
    recommendations.push("Versuche längere Arbeitsblöcke für mehr Fokus.");
  } else {
    insights.push("Niedrige Aktivität erkannt.");
    recommendations.push("Nimm dir bewusst Zeit für dein Projekt.");
    recommendations.push("Kleine Schritte – jeden Tag ein Snapshot.");
  }

  const trend = score >= 70 ? "improving" : score >= 40 ? "stable" : "declining";

  return {
    category: "Produktivität",
    score,
    trend,
    insights,
    recommendations,
  };
}

function analyzeErrorBehavior(
  score: number,
  errors: any[],
  saves: any[]
): SectorAnalysis {
  const insights: string[] = [];
  const recommendations: string[] = [];

  if (score >= 90) {
    insights.push("Sehr niedrige Fehlerrate – exzellente Arbeit!");
  } else if (score >= 70) {
    insights.push("Wenige Fehler – solider Workflow.");
  } else if (score >= 50) {
    insights.push("Moderate Fehlerrate.");
    recommendations.push("Nutze häufiger Snapshots als Checkpoints.");
  } else {
    insights.push("Hohe Fehlerrate erkannt.");
    recommendations.push("Prüfe die Logs auf wiederkehrende Probleme.");
    recommendations.push("Erstelle Backup-Snapshots vor größeren Änderungen.");
  }

  const trend = score >= 70 ? "improving" : score >= 40 ? "stable" : "declining";

  return {
    category: "Fehlerverhalten",
    score,
    trend,
    insights,
    recommendations,
  };
}

function analyzeFocusBalance(
  score: number,
  saves: any[],
  restores: any[]
): SectorAnalysis {
  const insights: string[] = [];
  const recommendations: string[] = [];

  if (score >= 80) {
    insights.push("Stark fokussierte Arbeitsweise.");
    insights.push(`${saves.length} Saves zeigen langfristigen Fokus.`);
  } else if (score >= 50) {
    insights.push("Ausgewogenes Arbeiten.");
  } else {
    insights.push(`${restores.length} Restores deuten auf häufiges Experimentieren hin.`);
    recommendations.push("Nutze Branches für Experimente statt zu restoren.");
    recommendations.push("Versuche längere Arbeitsblöcke ohne Zurücksetzen.");
  }

  const trend = score >= 70 ? "improving" : score >= 40 ? "stable" : "declining";

  return {
    category: "Fokusbalance",
    score,
    trend,
    insights,
    recommendations,
  };
}

function analyzeRhythm(score: number, events: any[]): SectorAnalysis {
  const insights: string[] = [];
  const recommendations: string[] = [];

  if (score >= 80) {
    insights.push("Sehr konsistenter Arbeitsrhythmus.");
  } else if (score >= 50) {
    insights.push("Unregelmäßiges aber aktives Arbeiten.");
  } else {
    insights.push("Unrhythmische Aktivität erkannt.");
    recommendations.push("Versuche feste Arbeitszeiten einzuhalten.");
    recommendations.push("Autosave-Intervall anpassen könnte helfen.");
  }

  const trend = score >= 70 ? "improving" : score >= 40 ? "stable" : "declining";

  return {
    category: "Rhythmus",
    score,
    trend,
    insights,
    recommendations,
  };
}

function analyzeRecentTrend(
  recentFeedback: any[],
  recentSnapshots: any[]
): string {
  const veryRecent = recentFeedback.filter(
    (e) => Date.now() - e.timestamp < 60 * 60 * 1000
  ); // Last hour

  const recentSaves = veryRecent.filter((e) => e.type === "save").length;
  const recentErrors = veryRecent.filter((e) => e.type === "error").length;

  if (recentSaves > 5 && recentErrors === 0) {
    return "Sehr aktiv heute – kraftvolle Produktivität!";
  } else if (recentErrors > 2) {
    return "Viele Fehler heute – vielleicht brauchst du eine Pause?";
  } else if (recentSaves >= 2) {
    return "Aktive Session – du bist im Flow!";
  } else if (recentSaves === 0 && recentSnapshots.length === 0) {
    return "Ruhezeit – gönn dir Entspannung.";
  }

  return "Ausgeglichene Aktivität.";
}



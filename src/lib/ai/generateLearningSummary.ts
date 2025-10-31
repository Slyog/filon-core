/**
 * Learning Summary Generator (AI v0.2)
 * Combines Summaries + FeedbackEvents → generates short meta-analysis
 * Future: GPT integration for contextual insights
 */
import { listFeedbackEvents } from "@/lib/feedback/FeedbackStore";
import { listSnapshots } from "@/lib/versionManager";

export async function generateLearningSummary(): Promise<string | null> {
  try {
    const feedback = await listFeedbackEvents(100);
    const snapshots = await listSnapshots();

    const saves = feedback.filter((e) => e.type === "save").length;
    const errors = feedback.filter((e) => e.type === "error").length;
    const snapshotsCount = snapshots.length;
    const restores = feedback.filter((e) => e.type === "restore").length;

    let summary = "🧠 FILON Learning Summary (v0.2)\n\n";

    // Productivity patterns
    if (saves > 10 && errors < 2) {
      summary += "✅ Du arbeitest kontinuierlich und stabil – deine Sessions zeigen Fokus.\n\n";
    }
    
    if (errors >= 3) {
      summary += "⚠️ Einige Fehlversuche deuten auf experimentelles Verhalten hin – vielleicht lohnt sich ein Debug-Review.\n\n";
    }
    
    if (snapshotsCount > 5) {
      summary += "🌱 Viele Snapshots – dein Projekt entwickelt sich rasch!\n\n";
    }
    
    if (saves < 5 && snapshotsCount < 2) {
      summary += "💭 Wenig Aktivität erkannt – nimm dir vielleicht Zeit für einen Fokus-Block.\n\n";
    }

    if (restores >= 3) {
      summary += "⏮️ Häufige Restores – du experimentierst aktiv mit Ideen.\n\n";
    }

    // Overall assessment
    summary += "📊 Gesamt-Eindruck: ";
    if (saves > 10 && errors <= 1) {
      summary += "stabil & produktiv.";
    } else if (errors > 3) {
      summary += "instabil, aber lernend.";
    } else {
      summary += "ausgeglichen.";
    }

    return summary.trim();
  } catch (err) {
    console.warn("Failed to generate learning summary:", err);
    return null;
  }
}

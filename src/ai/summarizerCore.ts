import { useExplainCache } from "@/store/ExplainCache";

export interface AISummary {
  id: string;
  threadId: string;
  text: string;
  confidence: number;
  createdAt: number;
}

export function generateThreadId(context: string): string {
  return context.toLowerCase().split(" ").slice(0, 3).join("-");
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function generateSummary(
  input: string
): Promise<{ text: string; confidence: number }> {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      text: "Kein Eingabetext vorhanden. Füge eine Beschreibung hinzu, um eine Erklärung zu erhalten.",
      confidence: 0.8,
    };
  }

  await new Promise((res) => setTimeout(res, 600));

  return {
    text: `Kurze AI-Zusammenfassung für „${trimmed}“ – der Gedanke fokussiert die aktuell markierte Wissenseinheit und verknüpft relevante Beziehungen.`,
    confidence: 0.92,
  };
}

export async function generatePanelSummary(
  title: string,
  context: string
): Promise<AISummary> {
  // Mock AI response (later replaced with real LLM call)
  await new Promise((res) => setTimeout(res, 800)); // simulate latency
  const aiText = `This panel "${title}" represents an active process in FILON. It visualizes ${context.toLowerCase()}.`;
  const confidenceScore = Math.random() * 0.2 + 0.8; // 0.8–1.0

  const summary: AISummary = {
    id: generateId(),
    threadId: generateThreadId(context),
    text: aiText,
    confidence: confidenceScore,
    createdAt: Date.now(),
  };

  return summary;
}

import { useExplainCache } from "@/store/ExplainCache";

export type AISummary = {
  text: string;
  confidence: number; // 0–1
};

export async function generatePanelSummary(
  title: string,
  context: string
): Promise<AISummary> {
  const { getEntry, saveEntry } = useExplainCache.getState();
  const cached = getEntry(title);
  if (cached) {
    return { text: cached.summary, confidence: cached.confidence };
  }

  // Mock AI response (later replaced with real LLM call)
  await new Promise((res) => setTimeout(res, 800)); // simulate latency
  const baseText = `This panel "${title}" represents an active process in FILON. It visualizes ${context.toLowerCase()}.`;
  const confidence = Math.random() * 0.2 + 0.8; // 0.8–1.0

  const entry = {
    title,
    summary: baseText,
    confidence,
    timestamp: Date.now(),
  };
  await saveEntry(title, entry);

  return { text: baseText, confidence };
}

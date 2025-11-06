import { useExplainCache } from "@/store/ExplainCache";
import { getExplainCache, setExplainCache } from "@/hooks/useExplainCache";

export interface AISummary {
  id: string;
  threadId: string;
  text: string;
  confidence: number;
  createdAt: number;
}

export interface SummaryV2Result {
  text: string;
  confidence: number;
  tokens?: number;
  latency?: number;
  fromCache?: boolean;
}

export function generateThreadId(context: string): string {
  return context.toLowerCase().split(" ").slice(0, 3).join("-");
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get confidence color class based on confidence value
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return "emerald-400";
  if (confidence >= 0.75) return "yellow-400";
  return "orange-400";
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
    text: `Kurze AI-Zusammenfassung für „${trimmed}" – der Gedanke fokussiert die aktuell markierte Wissenseinheit und verknüpft relevante Beziehungen.`,
    confidence: 0.92,
  };
}

/**
 * Generate Summary V2 - Async pipeline with caching, confidence colors, and fallback logic
 * @param nodeId - Node ID for caching
 * @param content - Content to summarize
 * @returns Summary result with text, confidence, tokens, and latency
 */
export async function generateSummaryV2(
  nodeId: string,
  content: string
): Promise<SummaryV2Result> {
  const start = performance.now();

  // Offline fallback: read from ExplainCache
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const cached = getExplainCache(nodeId);
    if (cached) {
      return {
        text: cached,
        confidence: 0.6,
        fromCache: true,
        latency: performance.now() - start,
      };
    }
    return {
      text: "Offline summary (cached)",
      confidence: 0.6,
      fromCache: true,
      latency: performance.now() - start,
    };
  }

  try {
    // Simulate API latency with setTimeout(800–1200ms)
    const latency = 800 + Math.random() * 400;
    await new Promise((res) => setTimeout(res, latency));

    // Generate confidence score (0.75-0.95 range)
    const confidence = 0.75 + Math.random() * 0.2;

    // Generate summary text
    const trimmedContent = content.trim();
    const preview = trimmedContent.slice(0, 50);
    const text = `AI Summary for "${preview}${trimmedContent.length > 50 ? "..." : ""}" – This thought focuses on the currently marked knowledge unit and connects relevant relationships.`;

    // Cache the result
    setExplainCache(nodeId, text);

    return {
      text,
      confidence,
      tokens: Math.floor(text.length / 4), // Rough token estimate
      latency: performance.now() - start,
      fromCache: false,
    };
  } catch (err) {
    console.error("[generateSummaryV2] Error:", err);
    // Fallback to cache if available
    const cached = getExplainCache(nodeId);
    if (cached) {
      return {
        text: cached,
        confidence: 0.6,
        fromCache: true,
        latency: performance.now() - start,
      };
    }
    throw err;
  }
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

import { graphToolchain } from "@/lib/graphToolchain";
import { getActiveAgent } from "@/server/agentRouter";
import { log } from "@/utils/logger";

export type FILONIntent =
  | "create"
  | "summarize"
  | "link"
  | "explain"
  | "reflect"
  | "unknown";

export interface RoutedIntentResult {
  intent: FILONIntent;
  agent: string;
  agentType: string;
  result?: unknown;
  message?: string;
}

declare global {
  interface Window {
    __intent?: FILONIntent;
  }
}

export async function detectIntent(input: string): Promise<FILONIntent> {
  const text = input.toLowerCase();

  if (text.match(/\b(create|make|add|new)\b/)) return "create";
  if (text.match(/\b(summarize|shorten|compress|overview)\b/)) return "summarize";
  if (text.match(/\b(link|connect|relate|tie)\b/)) return "link";
  if (text.match(/\b(explain|why|how)\b/)) return "explain";
  if (text.match(/\b(reflect|analyze|review)\b/)) return "reflect";
  return "unknown";
}

export async function routeIntent(
  prompt: string,
  context: Record<string, unknown> = {}
): Promise<RoutedIntentResult> {
  const intent = await detectIntent(prompt);
  const agent = await getActiveAgent();

  log.info(`[Intent] ${intent.toUpperCase()} via ${agent.name}`);

  let result: unknown;
  let message: string | undefined;

  switch (intent) {
    case "create":
    case "summarize":
    case "link": {
      const selection = Array.isArray(context.selection)
        ? (context.selection as string[])
        : [];
      const chainResult = await graphToolchain(selection);
      result = chainResult;
      const nodeId =
        typeof chainResult?.node?.id === "string"
          ? chainResult.node.id
          : undefined;
      message = nodeId
        ? `Graph toolchain completed (node ${nodeId})`
        : "Graph toolchain completed.";
      break;
    }
    case "explain":
      result = { text: `🧠 ${agent.name} explaining...` };
      message = `${agent.name} is explaining…`;
      break;
    case "reflect":
      result = { text: "🔍 Reflection Mode engaged" };
      message = "Reflection mode engaged.";
      break;
    default:
      result = { text: "🤔 Unclear intent – please specify." };
      message = "Intent unclear.";
      break;
  }

  return {
    intent,
    agent: agent.name,
    agentType: agent.type,
    result,
    message,
  };
}

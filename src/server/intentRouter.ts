import { runStepEngineToolchain } from "@/ai/toolchain/stepEngineToolchain";
import { getActiveAgent } from "@/server/agentRouter";
import { log } from "@/utils/logger";

export type FILONIntent =
  | "createGoal"
  | "generateTracks"
  | "generateSteps"
  | "updateStep"
  | "updateJourney"
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

  if (text.match(/\b(goal|create goal|new goal)\b/)) return "createGoal";
  if (text.match(/\b(track|tracks|generate track|create track)\b/)) return "generateTracks";
  if (text.match(/\b(step|steps|generate step|create step)\b/)) return "generateSteps";
  if (text.match(/\b(update step|modify step|change step)\b/)) return "updateStep";
  if (text.match(/\b(journey|progress|update journey)\b/)) return "updateJourney";
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
    case "createGoal": {
      const goalTitle = typeof context.goalTitle === "string" ? context.goalTitle : prompt;
      const stepResult = await runStepEngineToolchain("createGoal", {
        title: goalTitle,
        description: typeof context.description === "string" ? context.description : undefined,
      });
      result = stepResult;
      message = stepResult.success
        ? `Goal created successfully`
        : `Failed to create goal: ${stepResult.message}`;
      break;
    }
    case "generateTracks": {
      const goalId = typeof context.goalId === "string" ? context.goalId : "";
      const trackTypes = Array.isArray(context.trackTypes) ? context.trackTypes : undefined;
      const stepResult = await runStepEngineToolchain("generateTracks", {
        goalId,
        trackTypes,
      });
      result = stepResult;
      message = stepResult.success
        ? `Tracks generated successfully`
        : `Failed to generate tracks: ${stepResult.message}`;
      break;
    }
    case "generateSteps": {
      const trackId = typeof context.trackId === "string" ? context.trackId : "";
      const steps = Array.isArray(context.steps) ? context.steps : [];
      const stepResult = await runStepEngineToolchain("generateSteps", {
        trackId,
        steps,
      });
      result = stepResult;
      message = stepResult.success
        ? `Steps generated successfully`
        : `Failed to generate steps: ${stepResult.message}`;
      break;
    }
    case "updateStep": {
      const stepId = typeof context.stepId === "string" ? context.stepId : "";
      const stepResult = await runStepEngineToolchain("updateStep", {
        stepId,
        ...context,
      });
      result = stepResult;
      message = stepResult.success
        ? `Step updated successfully`
        : `Failed to update step: ${stepResult.message}`;
      break;
    }
    case "updateJourney": {
      const goalId = typeof context.goalId === "string" ? context.goalId : "";
      const stepResult = await runStepEngineToolchain("updateJourneyState", {
        goalId,
        ...context,
      });
      result = stepResult;
      message = stepResult.success
        ? `Journey state updated successfully`
        : `Failed to update journey state: ${stepResult.message}`;
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

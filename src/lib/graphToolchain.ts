"use server";

import {
  createNode,
  linkNodes,
  summarizeSelection,
} from "@/server/graphActions";
import { getActiveAgent } from "@/server/agentRouter";
import { recordMetaRun } from "@/lib/metaTracker";
import { log } from "@/utils/logger";

type SimulateFailureConfig =
  | string
  | string[]
  | {
      step: string;
      attempts?: number;
    }
  | Record<string, number | undefined>;

export type GraphToolchainOptions = {
  simulateFailure?: SimulateFailureConfig;
};

async function retry<T>(
  fn: () => Promise<T>,
  label: string,
  shouldSimulate?: () => boolean,
  onRetry?: (attempt: number, error: unknown, max: number) => void,
  max = 3,
  delay = 500
): Promise<T> {
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      if (shouldSimulate?.()) {
        throw new Error(`[FILON Retry] simulated failure for ${label}`);
      }

      const result = await fn();
      if (attempt > 1) {
        log.info(`[Retry] ${label} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (err) {
      log.warn(`[Retry] ${label} failed (attempt ${attempt}/${max})`, err);
      onRetry?.(attempt, err, max);
      if (attempt < max) {
        await new Promise((resolve) => setTimeout(resolve, delay * attempt));
      } else {
        throw new Error(`[FILON Retry] ${label} permanently failed`);
      }
    }
  }

  throw new Error(`[FILON Retry] ${label} unreachable`);
}

function createFailureController(sim?: SimulateFailureConfig) {
  const budgets = new Map<string, number>();

  const addBudget = (step: string, attempts?: number) => {
    const count = Math.max(1, attempts ?? 1);
    budgets.set(step, count);
  };

  if (!sim) {
    return () => false;
  }

  if (typeof sim === "string") {
    addBudget(sim);
  } else if (Array.isArray(sim)) {
    sim.forEach((step) => addBudget(step));
  } else if (typeof sim === "object" && sim !== null) {
    if ("step" in sim && typeof sim.step === "string") {
      addBudget(sim.step, sim.attempts);
    } else {
      Object.entries(sim as Record<string, number | undefined>).forEach(
        ([step, attempts]) => addBudget(step, attempts)
      );
    }
  }

  return (step: string) => {
    const remaining = budgets.get(step);
    if (remaining && remaining > 0) {
      if (remaining === 1) {
        budgets.delete(step);
      } else {
        budgets.set(step, remaining - 1);
      }
      return true;
    }
    return false;
  };
}

export async function graphToolchain(
  selection: string[],
  options?: GraphToolchainOptions
) {
  const agent = await getActiveAgent();
  log.info(`[Toolchain] Active agent ${agent.name}`);

  const shouldSimulate = createFailureController(options?.simulateFailure);
  let retries = 0;
  const start = Date.now();

  try {
    const summary = await retry(
      () => summarizeSelection(selection, agent),
      "summarizeSelection",
      () => shouldSimulate("summarizeSelection"),
      (attempt, _error, max) => {
        if (attempt < max) {
          retries += 1;
        }
      }
    );
    log.info("[Toolchain] Summary created", summary);

    const node = await retry(
      () =>
        createNode({
          title: summary.title ?? "AI Summary Node",
          content: summary.text ?? "",
          tags: ["auto", "ai-summary"],
        }),
      "createNode",
      () => shouldSimulate("createNode"),
      (attempt, _error, max) => {
        if (attempt < max) {
          retries += 1;
        }
      }
    );

    for (const id of selection) {
      await retry(
        () => linkNodes(id, node.id),
        `linkNodes(${id})`,
        () =>
          shouldSimulate(`linkNodes(${id})`) || shouldSimulate("linkNodes"),
        (attempt, _error, max) => {
          if (attempt < max) {
            retries += 1;
          }
        }
      );
    }

    const duration = Date.now() - start;
    await recordMetaRun({
      step: "35.7",
      agent: agent.name,
      agentType: agent.type,
      duration_ms: duration,
      retries,
      status: "pass",
    });

    log.info("[Toolchain] complete", node.id);
    return { summary, node, retries };
  } catch (error) {
    const duration = Date.now() - start;
    await recordMetaRun({
      step: "35.7",
      agent: agent.name,
      agentType: agent.type,
      duration_ms: duration,
      retries,
      status: "fail",
    });
    throw error;
  }
}
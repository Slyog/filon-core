"use client";
import Automerge, { loadAutomerge } from "@/lib/automergeClient";
import type { Doc } from "@automerge/automerge";
import { syncLambdaHandler } from "./syncLambdaHandler";
import type { SyncEvent } from "./syncSchema";
import type { Goal } from "@/types/filon";

// Ensure Automerge is loaded before use
let automergeReady = false;

async function ensureAutomerge() {
  if (!automergeReady) {
    await loadAutomerge();
    automergeReady = true;
  }
}

// FILON v4: Using Goal-based documents instead of GraphDoc
export type AutomergeGoalDoc = Doc<{
  goal: Goal;
  sessionId: string;
  docId?: string;
}>;

/**
 * Applies a change to an Automerge document
 */
export type GoalChangeFn = (doc: { goal: Goal; sessionId: string; docId?: string }) => void;

export async function applyChange(
  doc: AutomergeGoalDoc,
  change: GoalChangeFn
): Promise<AutomergeGoalDoc> {
  try {
    await ensureAutomerge();
    return Automerge.change(doc, change);
  } catch (err) {
    console.error("[SYNC] Error applying change:", err);
    throw err;
  }
}

/**
 * Converts Automerge document to binary format
 */
export async function getBinary(doc: AutomergeGoalDoc): Promise<Uint8Array> {
  try {
    await ensureAutomerge();
    return Automerge.save(doc);
  } catch (err) {
    console.error("[SYNC] Error converting to binary:", err);
    throw err;
  }
}

/**
 * Loads Automerge document from binary format
 */
export async function loadBinary(
  binary: Uint8Array
): Promise<AutomergeGoalDoc> {
  try {
    await ensureAutomerge();
    return Automerge.load<{ goal: Goal; sessionId: string; docId?: string }>(binary);
  } catch (err) {
    console.error("[SYNC] Error loading from binary:", err);
    throw err;
  }
}

/**
 * Creates an empty Automerge document seeded with default goal metadata.
 */
export async function createAutomergeGoalDoc(
  sessionId: string,
  goalId?: string
): Promise<AutomergeGoalDoc> {
  await ensureAutomerge();
  const seed = {
    goal: {
      id: goalId || crypto.randomUUID(),
      title: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Goal,
    sessionId,
    docId: goalId,
  };
  return Automerge.from<{ goal: Goal; sessionId: string; docId?: string }>(seed);
}

/**
 * Event handler for commit events
 * Triggers sync to Lambda handler
 */
export async function onCommit(
  change: any,
  userId: string,
  sessionId: string,
  diffSummary: string
) {
  console.log("[SYNC] Commit event triggered", {
    userId,
    sessionId,
    diffSummary,
  });

  const syncEvent: SyncEvent = {
    userId,
    sessionId,
    diffSummary,
    change,
    timestamp: Date.now(),
  };

  try {
    await syncLambdaHandler(syncEvent);
  } catch (err) {
    console.error("[SYNC] Failed to sync commit:", err);
    // TODO: Add retry/backoff for offline→online
    throw err;
  }
}

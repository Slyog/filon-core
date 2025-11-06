"use client";
import Automerge, { loadAutomerge } from "@/lib/automergeClient";
import type { Doc } from "@automerge/automerge";
import { syncLambdaHandler } from "./syncLambdaHandler";
import type { SyncEvent } from "./syncSchema";
import type { GraphDoc } from "@/types/graph";
import { createEmptyGraphDoc } from "@/types/graph";

// Ensure Automerge is loaded before use
let automergeReady = false;

async function ensureAutomerge() {
  if (!automergeReady) {
    await loadAutomerge();
    automergeReady = true;
  }
}

export type AutomergeGraphDoc = Doc<GraphDoc>;

/**
 * Applies a change to an Automerge document
 */
export type GraphChangeFn = (doc: GraphDoc) => void;

export async function applyChange(
  doc: AutomergeGraphDoc,
  change: GraphChangeFn
): Promise<AutomergeGraphDoc> {
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
export async function getBinary(doc: AutomergeGraphDoc): Promise<Uint8Array> {
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
): Promise<AutomergeGraphDoc> {
  try {
    await ensureAutomerge();
    return Automerge.load<GraphDoc>(binary);
  } catch (err) {
    console.error("[SYNC] Error loading from binary:", err);
    throw err;
  }
}

/**
 * Creates an empty Automerge document seeded with default graph metadata.
 */
export async function createAutomergeGraphDoc(
  sessionId: string,
  docId?: string
): Promise<AutomergeGraphDoc> {
  await ensureAutomerge();
  const seed = createEmptyGraphDoc({ sessionId, docId });
  return Automerge.from<GraphDoc & Record<string, unknown>>(
    seed as GraphDoc & Record<string, unknown>
  );
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

"use client";
import Automerge from "@/lib/automergeClient";
import type { Doc } from "@automerge/automerge/next";
import { syncLambdaHandler } from "./syncLambdaHandler";
import type { SyncEvent } from "./syncSchema";
import type { GraphDoc } from "@/types/graph";
import { createEmptyGraphDoc } from "@/types/graph";

export type AutomergeGraphDoc = Doc<GraphDoc>;

/**
 * Applies a change to an Automerge document
 */
export type GraphChangeFn = (doc: GraphDoc) => void;

export function applyChange(
  doc: AutomergeGraphDoc,
  change: GraphChangeFn
): AutomergeGraphDoc {
  try {
    return Automerge.change(doc, change);
  } catch (err) {
    console.error("[SYNC] Error applying change:", err);
    throw err;
  }
}

/**
 * Converts Automerge document to binary format
 */
export function getBinary(doc: AutomergeGraphDoc): Uint8Array {
  try {
    return Automerge.save(doc);
  } catch (err) {
    console.error("[SYNC] Error converting to binary:", err);
    throw err;
  }
}

/**
 * Loads Automerge document from binary format
 */
export function loadBinary(binary: Uint8Array): AutomergeGraphDoc {
  try {
    return Automerge.load<GraphDoc>(binary);
  } catch (err) {
    console.error("[SYNC] Error loading from binary:", err);
    throw err;
  }
}

/**
 * Creates an empty Automerge document seeded with default graph metadata.
 */
export function createAutomergeGraphDoc(
  sessionId: string,
  docId?: string
): AutomergeGraphDoc {
  const seed = createEmptyGraphDoc({ sessionId, docId });
  return Automerge.from<GraphDoc>(seed);
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

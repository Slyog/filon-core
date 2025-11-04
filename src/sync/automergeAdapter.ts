"use client";
import Automerge from "@/lib/automergeClient";
import { syncLambdaHandler } from "./syncLambdaHandler";
import type { SyncEvent } from "./syncSchema";

export type GraphDoc = any;

/**
 * Applies a change to an Automerge document
 */
export function applyChange(doc: GraphDoc, change: any): GraphDoc {
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
export function getBinary(doc: GraphDoc): Uint8Array {
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
export function loadBinary(binary: Uint8Array): GraphDoc {
  try {
    return Automerge.load(binary);
  } catch (err) {
    console.error("[SYNC] Error loading from binary:", err);
    throw err;
  }
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

"use client";

import Automerge, { loadAutomerge } from "@/lib/automergeClient";
import localforage from "localforage";
import type { Node, Edge } from "reactflow";

// Ensure Automerge is loaded before use
let automergeReady = false;

async function ensureAutomerge() {
  if (!automergeReady) {
    await loadAutomerge();
    automergeReady = true;
  }
}

/**
 * Sanitizes nodes/edges by removing undefined values that Automerge doesn't support
 */
function sanitizeForAutomerge<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForAutomerge(item)) as T;
  }

  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForAutomerge(value);
      }
    }
    return sanitized as T;
  }

  return obj;
}

/**
 * Gets the current Automerge binary from storage or creates it from graph state
 */
export async function getAutomergeBinary(
  nodes?: Node[],
  edges?: Edge[]
): Promise<Uint8Array | null> {
  try {
    await ensureAutomerge();

    if (!Automerge) {
      console.warn("[AUTOSAVE] Automerge not available");
      return null;
    }

    // Try to load existing Automerge document
    const saved = await localforage.getItem<Uint8Array>("noion-graph-doc");
    if (saved) {
      return saved;
    }

    // If no existing doc and we have graph state, create one
    if (nodes && edges) {
      // Sanitize nodes and edges to remove undefined values
      const sanitizedNodes = sanitizeForAutomerge(nodes);
      const sanitizedEdges = sanitizeForAutomerge(edges);

      const doc = Automerge.init();
      const next = Automerge.change(doc, (d: any) => {
        d.nodes = sanitizedNodes;
        d.edges = sanitizedEdges;
      });
      const binary = Automerge.save(next);
      await localforage.setItem("noion-graph-doc", binary);
      return binary;
    }

    return null;
  } catch (err) {
    console.error("[AUTOSAVE] Failed to get Automerge binary:", err);
    return null;
  }
}

/**
 * Updates the Automerge document with current graph state and returns binary
 */
export async function updateAutomergeBinary(
  nodes: Node[],
  edges: Edge[]
): Promise<Uint8Array | null> {
  try {
    await ensureAutomerge();

    if (!Automerge) {
      console.warn("[AUTOSAVE] Automerge not available");
      return null;
    }

    // Sanitize nodes and edges to remove undefined values
    const sanitizedNodes = sanitizeForAutomerge(nodes);
    const sanitizedEdges = sanitizeForAutomerge(edges);

    // Load existing doc or create new one
    let doc = await localforage.getItem<Uint8Array>("noion-graph-doc");
    if (doc) {
      try {
        doc = Automerge.load(doc);
      } catch {
        // If loading fails, create new doc
        doc = Automerge.init();
      }
    } else {
      doc = Automerge.init();
    }

    // Update with current state (using sanitized data)
    const updated = Automerge.change(doc, (d: any) => {
      d.nodes = sanitizedNodes;
      d.edges = sanitizedEdges;
    });

    // Save and return binary
    const binary = Automerge.save(updated);
    await localforage.setItem("noion-graph-doc", binary);
    return binary;
  } catch (err) {
    console.error("[AUTOSAVE] Failed to update Automerge binary:", err);
    return null;
  }
}

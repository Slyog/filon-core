"use client";
import localforage from "localforage";
import Automerge from "@/lib/automergeClient";

export type GraphDoc = any;

export async function initGraphDoc(): Promise<GraphDoc> {
  try {
    const saved = await localforage.getItem<Uint8Array>("noion-graph-doc");
    if (saved) {
      return Automerge.load(saved);
    }
    const doc = Automerge.init();
    const next = Automerge.change(doc, (d: any) => {
      d.nodes = [];
      d.edges = [];
    });
    await persistGraphDoc(next);
    return next;
  } catch (err) {
    console.error("[FILON] Automerge runtime error in initGraphDoc:", err);
    return null;
  }
}

export async function persistGraphDoc(doc: GraphDoc) {
  try {
    const binary = Automerge.save(doc);
    await localforage.setItem("noion-graph-doc", binary);
  } catch (err) {
    console.error("[FILON] Automerge runtime error in persistGraphDoc:", err);
  }
}

export async function mergeRemoteDoc(
  local: GraphDoc,
  remoteBinary: Uint8Array
) {
  try {
    const remote = Automerge.load(remoteBinary);
    const merged = Automerge.merge(local, remote);
    await persistGraphDoc(merged);
    return merged;
  } catch (err) {
    console.error("[FILON] Automerge runtime error in mergeRemoteDoc:", err);
    return null;
  }
}

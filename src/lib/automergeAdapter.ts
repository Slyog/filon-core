import * as Automerge from "@automerge/automerge";
import localforage from "localforage";

export type GraphDoc = Automerge.Doc<{ nodes: any[]; edges: any[] }>;

export async function initGraphDoc(): Promise<GraphDoc> {
  const saved = await localforage.getItem<Uint8Array>("noion-graph-doc");
  if (saved) {
    return Automerge.load(saved);
  }
  const doc = Automerge.init<{ nodes: any[]; edges: any[] }>();
  const next = Automerge.change(doc, (d) => {
    d.nodes = [];
    d.edges = [];
  });
  await persistGraphDoc(next);
  return next;
}

export async function persistGraphDoc(doc: GraphDoc) {
  const binary = Automerge.save(doc);
  await localforage.setItem("noion-graph-doc", binary);
}

export async function mergeRemoteDoc(
  local: GraphDoc,
  remoteBinary: Uint8Array
) {
  const remote = Automerge.load<{ nodes: any[]; edges: any[] }>(remoteBinary);
  const merged = Automerge.merge(local, remote);
  await persistGraphDoc(merged);
  return merged;
}

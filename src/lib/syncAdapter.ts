import localforage from "localforage";
import type { Node, Edge } from "reactflow";

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
  meta?: { lastSavedAt?: string };
}

export async function saveGraphRemote(graph: GraphData) {
  const res = await fetch("/api/graph", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(graph),
  });
  if (!res.ok) throw new Error("Remote save failed");
  await localforage.setItem("noion-graph", graph); // Cache speichern
}

export async function loadGraphSync(): Promise<GraphData> {
  try {
    const [local, remote] = await Promise.allSettled([
      localforage.getItem<GraphData>("noion-graph"),
      fetch("/api/graph").then((r) => r.json()),
    ]);

    const localData = local.status === "fulfilled" ? local.value : null;
    const remoteData = remote.status === "fulfilled" ? remote.value : null;

    if (!remoteData?.nodes?.length && localData) return localData;
    if (!localData) return remoteData!;

    const newer =
      new Date(remoteData?.meta?.lastSavedAt || 0) >
      new Date(localData?.meta?.lastSavedAt || 0)
        ? remoteData
        : localData;

    await localforage.setItem("noion-graph", newer);
    return newer;
  } catch (err) {
    console.error("Sync error", err);
    return (
      (await localforage.getItem("noion-graph")) ?? { nodes: [], edges: [] }
    );
  }
}

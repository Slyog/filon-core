import localforage from "localforage";
import type { Node, Edge } from "reactflow";
import {
  initGraphDoc,
  persistGraphDoc,
  mergeRemoteDoc,
} from "./automergeAdapter";
import { mergeWithStrategy } from "./conflictResolver";
import { SilverbulletCore } from "./silverbullet/core";

// Dynamic, SSR-safe Automerge import
let Automerge: any = null;

if (typeof window !== "undefined") {
  import("@automerge/automerge")
    .then((m) => {
      Automerge = m;
      console.info("[FILON] Automerge loaded in browser context");
    })
    .catch((err) => console.warn("[FILON] Automerge load failed:", err));
} else {
  console.info("[FILON] SSR context detected — skipping Automerge load");
}

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
  if (!res.ok) {
    const errorData = await res
      .json()
      .catch(() => ({ error: "Unknown error" }));
    console.error("❌ Remote save failed:", errorData);
    throw new Error(
      errorData.detail || errorData.error || "Remote save failed"
    );
  }
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

export async function syncAndResolve(
  strategy: "preferLocal" | "preferRemote" | "mergeProps" = "mergeProps"
) {
  try {
    if (!Automerge) {
      console.warn("[FILON] Automerge not loaded — skipping syncAndResolve");
      return null;
    }

    const localDoc = await initGraphDoc();
    const res = await fetch("/api/graph");
    const remoteJson = await res.json();
    const remoteBinary = new Uint8Array(remoteJson.automerge ?? []);
    const remoteDoc = Automerge.load(remoteBinary);

    const { merged, conflicts } = mergeWithStrategy(
      localDoc,
      remoteDoc,
      strategy
    );
    await persistGraphDoc(merged);

    // Silverbullet Event loggen
    if (conflicts.length > 0) {
      SilverbulletCore.log({
        type: "conflict",
        payload: { count: conflicts.length, strategy },
        timestamp: Date.now(),
      });
    } else {
      SilverbulletCore.log({
        type: "merge",
        payload: { strategy },
        timestamp: Date.now(),
      });
    }

    await fetch("/api/graph", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        automerge: Array.from(Automerge.save(merged)),
        nodes: merged.nodes,
        edges: merged.edges,
      }),
    });

    return { merged, conflicts };
  } catch (err) {
    console.error("[FILON] Sync + Conflict Resolution failed:", err);
    return null;
  }
}

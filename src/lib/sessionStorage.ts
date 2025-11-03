import localforage from "localforage";
import type { Node, Edge } from "reactflow";

const getKey = (sessionId: string) => `filon-graph:${sessionId}`;

export async function saveGraphToSession(
  sessionId: string,
  data: { nodes: Node[]; edges: Edge[] }
) {
  await localforage.setItem(getKey(sessionId), data);
}

export async function loadGraphFromSession(sessionId: string) {
  const stored = await localforage.getItem<{ nodes: Node[]; edges: Edge[] }>(
    getKey(sessionId)
  );
  return stored || { nodes: [], edges: [] };
}

export async function clearSessionGraph(sessionId: string) {
  await localforage.removeItem(getKey(sessionId));
}


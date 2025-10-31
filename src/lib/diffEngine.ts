import type { Node, Edge } from "reactflow";
import { GraphState } from "./sessionManager";

export interface DiffResult {
  addedNodes: Node[];
  removedNodes: Node[];
  changedNodes: { id: string; before: Node; after: Node }[];
  addedEdges: Edge[];
  removedEdges: Edge[];
}

/**
 * Compares two graph states and detects all differences
 * @param oldState - Previous graph state
 * @param newState - Current graph state
 * @returns DiffResult with all detected changes
 */
export function diffGraphs(
  oldState: GraphState,
  newState: GraphState
): DiffResult {
  const oldNodes = oldState.nodes || [];
  const newNodes = newState.nodes || [];
  const oldEdges = oldState.edges || [];
  const newEdges = newState.edges || [];

  // Find added and removed nodes
  const oldNodeIds = new Set(oldNodes.map((n) => n.id));
  const newNodeIds = new Set(newNodes.map((n) => n.id));

  const addedNodes = newNodes.filter((n) => !oldNodeIds.has(n.id));
  const removedNodes = oldNodes.filter((n) => !newNodeIds.has(n.id));

  // Find changed nodes (same ID but different content)
  const changedNodes: { id: string; before: Node; after: Node }[] = [];
  const oldNodeMap = new Map(oldNodes.map((n) => [n.id, n]));

  for (const newNode of newNodes) {
    const oldNode = oldNodeMap.get(newNode.id);
    if (oldNode && !equals(oldNode, newNode)) {
      changedNodes.push({ id: newNode.id, before: oldNode, after: newNode });
    }
  }

  // Find added and removed edges
  const oldEdgeKeySet = new Set(oldEdges.map((e) => `${e.source}-${e.target}`));
  const newEdgeKeySet = new Set(newEdges.map((e) => `${e.source}-${e.target}`));

  const addedEdges = newEdges.filter(
    (e) => !oldEdgeKeySet.has(`${e.source}-${e.target}`)
  );
  const removedEdges = oldEdges.filter(
    (e) => !newEdgeKeySet.has(`${e.source}-${e.target}`)
  );

  return {
    addedNodes,
    removedNodes,
    changedNodes,
    addedEdges,
    removedEdges,
  };
}

/**
 * Merges a diff result back into the base graph state
 * @param base - Base graph state
 * @param diff - Diff result containing changes to apply
 * @returns New merged graph state (does not mutate base)
 */
export function mergeGraphs(base: GraphState, diff: DiffResult): GraphState {
  // Create a copy of base to avoid mutations
  const mergedNodes = [...(base.nodes || [])];
  const mergedEdges = [...(base.edges || [])];

  // Apply added nodes
  mergedNodes.push(...diff.addedNodes);

  // Apply removed nodes
  const removedNodeIds = new Set(diff.removedNodes.map((n) => n.id));
  const filteredNodes = mergedNodes.filter((n) => !removedNodeIds.has(n.id));

  // Apply changed nodes (replace in place)
  const nodeMap = new Map(filteredNodes.map((n) => [n.id, n]));
  for (const change of diff.changedNodes) {
    nodeMap.set(change.id, change.after);
  }
  const finalNodes = Array.from(nodeMap.values());

  // Apply added edges
  mergedEdges.push(...diff.addedEdges);

  // Apply removed edges
  const removedEdgeKeys = new Set(
    diff.removedEdges.map((e) => `${e.source}-${e.target}`)
  );
  const finalEdges = mergedEdges.filter(
    (e) => !removedEdgeKeys.has(`${e.source}-${e.target}`)
  );

  return {
    nodes: finalNodes,
    edges: finalEdges,
    meta: base.meta,
  };
}

/**
 * Helper function to compare two nodes for equality
 * Compares id, label, position, and data fields (deep equality for data)
 */
function equals(a: Node, b: Node): boolean {
  if (a.id !== b.id) return false;

  const aData = a.data || {};
  const bData = b.data || {};

  // Compare essential properties
  if (aData.label !== bData.label) return false;
  if (aData.note !== bData.note) return false;
  if (a.position.x !== b.position.x) return false;
  if (a.position.y !== b.position.y) return false;

  return true;
}

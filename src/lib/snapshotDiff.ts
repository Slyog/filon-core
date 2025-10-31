import type { Node, Edge } from "reactflow";

export interface DiffResult {
  added: Node[];
  removed: Node[];
  modified: { old: Node; new: Node }[];
  edges: {
    added: Edge[];
    removed: Edge[];
  };
  summary: {
    nodeChanges: number;
    edgeChanges: number;
    totalChanges: number;
  };
}

/**
 * Compares two graph states and returns differences
 * @param oldState - Previous graph state
 * @param newState - Current graph state
 * @returns DiffResult with all changes
 */
export function diffSnapshots(
  oldState: { nodes: Node[]; edges: Edge[] },
  newState: { nodes: Node[]; edges: Edge[] }
): DiffResult {
  const oldNodes = oldState.nodes || [];
  const newNodes = newState.nodes || [];
  const oldEdges = oldState.edges || [];
  const newEdges = newState.edges || [];

  // Find added and removed nodes
  const oldNodeIds = new Set(oldNodes.map((n) => n.id));
  const newNodeIds = new Set(newNodes.map((n) => n.id));

  const added = newNodes.filter((n) => !oldNodeIds.has(n.id));
  const removed = oldNodes.filter((n) => !newNodeIds.has(n.id));

  // Find modified nodes (same ID but different content)
  const modified: { old: Node; new: Node }[] = [];
  const oldNodeMap = new Map(oldNodes.map((n) => [n.id, n]));
  
  for (const newNode of newNodes) {
    const oldNode = oldNodeMap.get(newNode.id);
    if (oldNode && !areNodesEqual(oldNode, newNode)) {
      modified.push({ old: oldNode, new: newNode });
    }
  }

  // Find added and removed edges
  const oldEdgeSet = new Set(
    oldEdges.map((e) => `${e.source}-${e.target}`)
  );
  const newEdgeSet = new Set(
    newEdges.map((e) => `${e.source}-${e.target}`)
  );

  const edgesAdded = newEdges.filter(
    (e) => !oldEdgeSet.has(`${e.source}-${e.target}`)
  );
  const edgesRemoved = oldEdges.filter(
    (e) => !newEdgeSet.has(`${e.source}-${e.target}`)
  );

  const nodeChanges = added.length + removed.length + modified.length;
  const edgeChanges = edgesAdded.length + edgesRemoved.length;

  return {
    added,
    removed,
    modified,
    edges: {
      added: edgesAdded,
      removed: edgesRemoved,
    },
    summary: {
      nodeChanges,
      edgeChanges,
      totalChanges: nodeChanges + edgeChanges,
    },
  };
}

/**
 * Compares two nodes for equality (ignoring transient props)
 */
function areNodesEqual(a: Node, b: Node): boolean {
  // Compare essential properties
  const aData = a.data || {};
  const bData = b.data || {};

  return (
    a.id === b.id &&
    aData.label === bData.label &&
    aData.note === bData.note &&
    a.position.x === b.position.x &&
    a.position.y === b.position.y
  );
}

/**
 * Merges two graph states with conflict resolution strategy
 * @param baseState - Current state
 * @param incomingState - State to merge from
 * @param strategy - Merge strategy: "preferIncoming" | "preferBase" | "combine"
 * @returns Merged state
 */
export function mergeSnapshots(
  baseState: { nodes: Node[]; edges: Edge[] },
  incomingState: { nodes: Node[]; edges: Edge[] },
  strategy: "preferIncoming" | "preferBase" | "combine" = "combine"
): { nodes: Node[]; edges: Edge[]; conflicts: string[] } {
  const conflicts: string[] = [];
  const baseNodes = baseState.nodes || [];
  const incomingNodes = incomingState.nodes || [];
  const baseEdges = baseState.edges || [];
  const incomingEdges = incomingState.edges || [];

  let mergedNodes: Node[];
  let mergedEdges: Edge[];

  switch (strategy) {
    case "preferIncoming":
      mergedNodes = [...incomingNodes];
      mergedEdges = [...incomingEdges];
      break;

    case "preferBase":
      mergedNodes = [...baseNodes];
      mergedEdges = [...baseEdges];
      break;

    case "combine":
    default:
      // Combine unique nodes
      const nodeMap = new Map<string, Node>();
      
      // Add base nodes
      for (const node of baseNodes) {
        nodeMap.set(node.id, node);
      }
      
      // Add or update incoming nodes
      for (const node of incomingNodes) {
        if (nodeMap.has(node.id)) {
          conflicts.push(`Node "${node.id}" exists in both states`);
          // Prefer incoming for combine strategy
          nodeMap.set(node.id, node);
        } else {
          nodeMap.set(node.id, node);
        }
      }
      
      mergedNodes = Array.from(nodeMap.values());

      // Combine unique edges
      const edgeSet = new Set<string>();
      mergedEdges = [];
      
      for (const edge of [...baseEdges, ...incomingEdges]) {
        const edgeKey = `${edge.source}-${edge.target}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          mergedEdges.push(edge);
        }
      }
      break;
  }

  return {
    nodes: mergedNodes,
    edges: mergedEdges,
    conflicts,
  };
}


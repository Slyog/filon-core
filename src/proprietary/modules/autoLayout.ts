/**
 * Proprietary Module: Auto Layout
 * 
 * Provides automatic layout configurations for ReactFlow based on thought type modes.
 * This module is part of the proprietary layer and separated from the GPL core.
 */

import type { Node, Edge } from "reactflow";

export type LayoutMode = "Reflection" | "Process" | "Idea";

export interface LayoutConfig {
  nodes: Node[];
  edges: Edge[];
  rationale: string; // For Explain Mode
}

/**
 * Get auto layout configuration for ReactFlow based on mode
 * @param mode - Layout mode: "Reflection" | "Process" | "Idea"
 * @param nodes - Current nodes to layout
 * @param edges - Current edges
 * @returns Layout config with positioned nodes and rationale
 */
export function getAutoLayout(
  mode: LayoutMode,
  nodes: Node[],
  edges: Edge[]
): LayoutConfig {
  const rationale = getLayoutRationale(mode);
  
  let positionedNodes: Node[] = [];
  
  switch (mode) {
    case "Reflection":
      positionedNodes = applyReflectionLayout(nodes, edges);
      break;
    case "Process":
      positionedNodes = applyProcessLayout(nodes, edges);
      break;
    case "Idea":
      positionedNodes = applyIdeaLayout(nodes, edges);
      break;
    default:
      positionedNodes = nodes;
  }
  
  return {
    nodes: positionedNodes,
    edges,
    rationale,
  };
}

/**
 * Apply Reflection layout: Hierarchical tree structure
 * Rationale: Reflections benefit from a top-down flow showing progression
 */
function applyReflectionLayout(nodes: Node[], edges: Edge[]): Node[] {
  const GRID_X = 300;
  const GRID_Y = 200;
  const START_X = 400;
  const START_Y = 100;
  
  // Build adjacency map
  const childrenMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();
  
  edges.forEach((edge) => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source)!.push(edge.target);
    parentMap.set(edge.target, edge.source);
  });
  
  // Find root nodes (nodes without incoming edges)
  const rootNodes = nodes.filter((node) => !parentMap.has(node.id));
  
  // Position nodes in hierarchical levels
  const positioned = new Map<string, Node>();
  let currentY = START_Y;
  
  function positionNode(nodeId: string, x: number, y: number, level: number) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || positioned.has(nodeId)) return;
    
    positioned.set(nodeId, {
      ...node,
      position: { x, y },
    });
    
    const children = childrenMap.get(nodeId) || [];
    const childX = x;
    const childY = y + GRID_Y;
    
    children.forEach((childId, index) => {
      const offsetX = (index - (children.length - 1) / 2) * GRID_X;
      positionNode(childId, childX + offsetX, childY, level + 1);
    });
  }
  
  // Position root nodes
  rootNodes.forEach((root, index) => {
    const x = START_X + index * GRID_X;
    positionNode(root.id, x, currentY, 0);
  });
  
  // Position remaining nodes (if any)
  nodes.forEach((node) => {
    if (!positioned.has(node.id)) {
      positioned.set(node.id, {
        ...node,
        position: { x: START_X, y: currentY },
      });
      currentY += GRID_Y;
    }
  });
  
  return Array.from(positioned.values());
}

/**
 * Apply Process layout: Linear flow from left to right
 * Rationale: Processes show sequential steps, best visualized horizontally
 */
function applyProcessLayout(nodes: Node[], edges: Edge[]): Node[] {
  const GRID_X = 350;
  const START_X = 200;
  const START_Y = 300;
  
  // Build sequence from edges
  const nextMap = new Map<string, string>();
  const prevMap = new Map<string, string>();
  
  edges.forEach((edge) => {
    nextMap.set(edge.source, edge.target);
    prevMap.set(edge.target, edge.source);
  });
  
  // Find start nodes (nodes without incoming edges)
  const startNodes = nodes.filter((node) => !prevMap.has(node.id));
  
  const positioned = new Map<string, Node>();
  let currentX = START_X;
  
  function positionSequence(nodeId: string, x: number) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || positioned.has(nodeId)) return;
    
    positioned.set(nodeId, {
      ...node,
      position: { x, y: START_Y },
    });
    
    const nextId = nextMap.get(nodeId);
    if (nextId) {
      positionSequence(nextId, x + GRID_X);
    }
  }
  
  // Position sequences starting from start nodes
  startNodes.forEach((start) => {
    positionSequence(start.id, currentX);
    currentX += GRID_X * 3; // Space between sequences
  });
  
  // Position remaining nodes
  nodes.forEach((node) => {
    if (!positioned.has(node.id)) {
      positioned.set(node.id, {
        ...node,
        position: { x: currentX, y: START_Y },
      });
      currentX += GRID_X;
    }
  });
  
  return Array.from(positioned.values());
}

/**
 * Apply Idea layout: Radial/spider structure
 * Rationale: Ideas benefit from a central hub with radiating connections
 */
function applyIdeaLayout(nodes: Node[], edges: Edge[]): Node[] {
  const CENTER_X = 500;
  const CENTER_Y = 400;
  const RADIUS = 250;
  
  if (nodes.length === 0) return nodes;
  
  const positioned = new Map<string, Node>();
  
  // Find central node (node with most connections, or first node)
  const connectionCount = new Map<string, number>();
  edges.forEach((edge) => {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) || 0) + 1);
    connectionCount.set(edge.target, (connectionCount.get(edge.target) || 0) + 1);
  });
  
  const centralNode = nodes.reduce((max, node) => {
    const count = connectionCount.get(node.id) || 0;
    const maxCount = connectionCount.get(max.id) || 0;
    return count > maxCount ? node : max;
  }, nodes[0]);
  
  // Position central node at center
  positioned.set(centralNode.id, {
    ...centralNode,
    position: { x: CENTER_X, y: CENTER_Y },
  });
  
  // Position other nodes in a circle around center
  const otherNodes = nodes.filter((n) => n.id !== centralNode.id);
  const angleStep = (2 * Math.PI) / Math.max(otherNodes.length, 1);
  
  otherNodes.forEach((node, index) => {
    const angle = index * angleStep;
    const x = CENTER_X + Math.cos(angle) * RADIUS;
    const y = CENTER_Y + Math.sin(angle) * RADIUS;
    
    positioned.set(node.id, {
      ...node,
      position: { x, y },
    });
  });
  
  return Array.from(positioned.values());
}

/**
 * Get rationale text for Explain Mode
 */
function getLayoutRationale(mode: LayoutMode): string {
  switch (mode) {
    case "Reflection":
      return "Reflection layout arranges nodes hierarchically to show progression and depth. Root concepts appear at the top, with related reflections branching downward.";
    case "Process":
      return "Process layout arranges nodes linearly from left to right, showing sequential steps and workflow progression.";
    case "Idea":
      return "Idea layout arranges nodes radially around a central concept, emphasizing connections and relationships between ideas.";
    default:
      return "Standard layout applied.";
  }
}


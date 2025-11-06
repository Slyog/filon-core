import type { Node } from "reactflow";

export interface Cluster {
  x: number;
  y: number;
  count: number;
}

/**
 * Groups nodes into grid cells and returns cluster centers.
 * @param nodes - Array of ReactFlow nodes with position data
 * @param cellSize - Size of each grid cell (default: 250)
 * @returns Array of cluster centers with their counts
 */
export function getNodeClusters(
  nodes: Node[],
  cellSize: number = 250
): Cluster[] {
  if (nodes.length === 0) {
    return [];
  }

  // Map to store cell coordinates -> count
  const cellMap = new Map<string, number>();

  // Group nodes into grid cells
  for (const node of nodes) {
    const x = node.position?.x ?? 0;
    const y = node.position?.y ?? 0;

    // Calculate grid cell coordinates
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);

    // Use cell coordinates as key
    const key = `${cellX},${cellY}`;
    cellMap.set(key, (cellMap.get(key) ?? 0) + 1);
  }

  // Convert to cluster centers (center of each cell)
  const clusters: Cluster[] = [];
  for (const [key, count] of cellMap.entries()) {
    const [cellX, cellY] = key.split(",").map(Number);
    clusters.push({
      x: cellX * cellSize + cellSize / 2,
      y: cellY * cellSize + cellSize / 2,
      count,
    });
  }

  return clusters;
}


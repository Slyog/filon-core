import localforage from "localforage";
import type { Node, Edge } from "reactflow";
import { GraphState } from "./sessionManager";

export interface SnapshotMeta {
  id: string;
  timestamp: number;
  nodeCount: number;
  edgeCount: number;
  // Branching support (Step 26)
  branchId?: string;
  parentId?: string;
  branchName?: string;
}

export interface Snapshot {
  id: string;
  timestamp: number;
  nodeCount: number;
  edgeCount: number;
  data: GraphState;
  // Branching support (Step 26)
  branchId?: string;
  parentId?: string;
  branchName?: string;
}

const SNAPSHOTS_KEYSPACE = "filon-snapshots";
const SNAPSHOT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const SNAPSHOT_METADATA_KEY = "filon-snapshot-metadata";

/**
 * Saves a snapshot of the current graph state
 * @param state - Graph state to snapshot
 * @param options - Optional branch info
 */
export async function saveSnapshot(
  state: GraphState,
  options?: {
    branchId?: string;
    branchName?: string;
    parentId?: string;
  }
): Promise<void> {
  try {
    const id = crypto.randomUUID();
    const timestamp = Date.now();

    const snapshot: Snapshot = {
      id,
      timestamp,
      nodeCount: state.nodes?.length ?? 0,
      edgeCount: state.edges?.length ?? 0,
      data: state,
      branchId: options?.branchId,
      branchName: options?.branchName,
      parentId: options?.parentId,
    };

    // Save snapshot
    await localforage.setItem(`${SNAPSHOTS_KEYSPACE}-${id}`, snapshot);

    // Update metadata list
    const metaList = await localforage.getItem<SnapshotMeta[]>(
      SNAPSHOT_METADATA_KEY
    );
    const newMeta: SnapshotMeta = {
      id,
      timestamp,
      nodeCount: snapshot.nodeCount,
      edgeCount: snapshot.edgeCount,
      branchId: options?.branchId,
      branchName: options?.branchName,
      parentId: options?.parentId,
    };

    const updatedMeta = metaList ? [newMeta, ...metaList] : [newMeta];
    await localforage.setItem(SNAPSHOT_METADATA_KEY, updatedMeta);

    console.log(
      `💾 Snapshot saved: ${id} (${snapshot.nodeCount} nodes, ${snapshot.edgeCount} edges)`
    );
  } catch (err) {
    console.warn("Failed to save snapshot:", err);
  }
}

/**
 * Lists all available snapshots, most recent first
 * @param limit - Optional limit on number of snapshots to return
 * @returns Array of snapshot metadata
 */
export async function listSnapshots(limit?: number): Promise<SnapshotMeta[]> {
  try {
    const metaList = await localforage.getItem<SnapshotMeta[]>(
      SNAPSHOT_METADATA_KEY
    );
    if (!metaList) return [];

    // Filter out expired snapshots
    const now = Date.now();
    const validSnapshots = metaList.filter(
      (meta) => now - meta.timestamp < SNAPSHOT_TTL
    );

    // Update metadata list if any were filtered out
    if (validSnapshots.length !== metaList.length) {
      await localforage.setItem(SNAPSHOT_METADATA_KEY, validSnapshots);
    }

    return limit ? validSnapshots.slice(0, limit) : validSnapshots;
  } catch (err) {
    console.warn("Failed to list snapshots:", err);
    return [];
  }
}

/**
 * Loads a specific snapshot by ID
 * @param id - Snapshot ID
 * @returns Graph state or null if not found
 */
export async function loadSnapshot(id: string): Promise<GraphState | null> {
  try {
    const snapshot = await localforage.getItem<Snapshot>(
      `${SNAPSHOTS_KEYSPACE}-${id}`
    );
    if (!snapshot) return null;

    // Check if snapshot is expired
    const age = Date.now() - snapshot.timestamp;
    if (age > SNAPSHOT_TTL) {
      console.log("Snapshot expired, removing:", id);
      await localforage.removeItem(`${SNAPSHOTS_KEYSPACE}-${id}`);
      // Remove from metadata
      const metaList = await localforage.getItem<SnapshotMeta[]>(
        SNAPSHOT_METADATA_KEY
      );
      if (metaList) {
        const filtered = metaList.filter((m) => m.id !== id);
        await localforage.setItem(SNAPSHOT_METADATA_KEY, filtered);
      }
      return null;
    }

    return snapshot.data;
  } catch (err) {
    console.warn("Failed to load snapshot:", err);
    return null;
  }
}

/**
 * Clears snapshots older than specified date (or 24h if not provided)
 * @param olderThan - Optional date threshold for deletion
 */
export async function clearSnapshots(olderThan?: Date): Promise<void> {
  try {
    const cutoff = olderThan ? olderThan.getTime() : Date.now() - SNAPSHOT_TTL;

    const metaList = await localforage.getItem<SnapshotMeta[]>(
      SNAPSHOT_METADATA_KEY
    );
    if (!metaList) return;

    let removedCount = 0;

    for (const meta of metaList) {
      if (meta.timestamp < cutoff) {
        await localforage.removeItem(`${SNAPSHOTS_KEYSPACE}-${meta.id}`);
        removedCount++;
      }
    }

    // Update metadata list
    const remainingSnapshots = metaList.filter(
      (meta) => meta.timestamp >= cutoff
    );
    await localforage.setItem(SNAPSHOT_METADATA_KEY, remainingSnapshots);

    if (removedCount > 0) {
      console.log(`🗑️ Cleared ${removedCount} expired snapshots`);
    }
  } catch (err) {
    console.warn("Failed to clear snapshots:", err);
  }
}

import localforage from "localforage";
import type { Node, Edge } from "reactflow";
import { GraphState } from "./sessionManager";
import { logSuccess, logError } from "@/utils/qaLogger";

export interface SnapshotMeta {
  id: string;
  timestamp: number;
  nodeCount: number;
  edgeCount: number;
  // Branching support (Step 26)
  branchId?: string;
  parentId?: string;
  branchName?: string;
  // Semantic tagging support (Step 29)
  tags?: string[];
  summary?: string;
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
): Promise<string | null> {
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

    logSuccess({
      step: "autosave",
      notes: `Session snapshot saved (${snapshot.nodeCount} nodes, ${snapshot.edgeCount} edges)`,
      meta: { snapshotId: id, nodeCount: snapshot.nodeCount, edgeCount: snapshot.edgeCount },
    });

    return id;
  } catch (err) {
    console.warn("Failed to save snapshot:", err);
    logError({
      step: "autosave",
      notes: err instanceof Error ? err.message : "Unknown save error",
      meta: { error: String(err) },
    });
    return null;
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

/**
 * Adds a tag to a snapshot
 * @param snapshotId - Snapshot ID
 * @param tag - Tag to add
 */
export async function addTag(snapshotId: string, tag: string): Promise<void> {
  try {
    const trimmedTag = tag.trim().toLowerCase();
    if (!trimmedTag) return;

    const metaList = await localforage.getItem<SnapshotMeta[]>(
      SNAPSHOT_METADATA_KEY
    );
    if (!metaList) return;

    const metaIndex = metaList.findIndex((m) => m.id === snapshotId);
    if (metaIndex === -1) return;

    const meta = metaList[metaIndex];
    const currentTags = meta.tags || [];

    // Check for duplicates
    if (currentTags.includes(trimmedTag)) return;

    // Add tag
    meta.tags = [...currentTags, trimmedTag];
    metaList[metaIndex] = meta;

    await localforage.setItem(SNAPSHOT_METADATA_KEY, metaList);
    console.log(`🏷️ Tag "${tag}" added to snapshot ${snapshotId}`);
  } catch (err) {
    console.warn("Failed to add tag:", err);
  }
}

/**
 * Removes a tag from a snapshot
 * @param snapshotId - Snapshot ID
 * @param tag - Tag to remove
 */
export async function removeTag(
  snapshotId: string,
  tag: string
): Promise<void> {
  try {
    const metaList = await localforage.getItem<SnapshotMeta[]>(
      SNAPSHOT_METADATA_KEY
    );
    if (!metaList) return;

    const metaIndex = metaList.findIndex((m) => m.id === snapshotId);
    if (metaIndex === -1) return;

    const meta = metaList[metaIndex];
    const currentTags = meta.tags || [];

    // Remove tag
    meta.tags = currentTags.filter((t) => t !== tag);
    metaList[metaIndex] = meta;

    await localforage.setItem(SNAPSHOT_METADATA_KEY, metaList);
    console.log(`🏷️ Tag "${tag}" removed from snapshot ${snapshotId}`);
  } catch (err) {
    console.warn("Failed to remove tag:", err);
  }
}

/**
 * Updates the summary text of a snapshot
 * @param snapshotId - Snapshot ID
 * @param text - Summary text
 */
export async function updateSummary(
  snapshotId: string,
  text: string
): Promise<void> {
  try {
    const trimmedText = text.trim();

    const metaList = await localforage.getItem<SnapshotMeta[]>(
      SNAPSHOT_METADATA_KEY
    );
    if (!metaList) return;

    const metaIndex = metaList.findIndex((m) => m.id === snapshotId);
    if (metaIndex === -1) return;

    const meta = metaList[metaIndex];
    meta.summary = trimmedText;
    metaList[metaIndex] = meta;

    await localforage.setItem(SNAPSHOT_METADATA_KEY, metaList);
    console.log(`📝 Summary updated for snapshot ${snapshotId}`);
  } catch (err) {
    console.warn("Failed to update summary:", err);
  }
}

/**
 * Generates a summary for a snapshot using AI (stub for Step 30)
 * @param snapshotId - Snapshot ID
 * @returns Summary text or null if not available
 */
export async function generateAISummary(
  snapshotId: string
): Promise<string | null> {
  // TODO: Implement AI summarization in Step 30
  // This will analyze the graph state and generate a contextual summary
  console.log(
    "🤖 AI summary generation (planned for Step 30) for snapshot:",
    snapshotId
  );
  return null;
}

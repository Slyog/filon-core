import localforage from "localforage";
import type { Node, Edge } from "reactflow";
import { loadSnapshot } from "./versionManager";
import { mergeGraphs } from "./diffEngine";
import type { GraphState } from "./sessionManager";

export interface Branch {
  id: string;
  name: string;
  parentSnapshotId: string | null;
  createdAt: number;
  updatedAt: number;
  nodeCount: number;
  edgeCount: number;
  isActive: boolean;
}

const BRANCH_KEYSPACE = "filon-branches";
const ACTIVE_BRANCH_KEY = "filon-active-branch";

/**
 * Creates a new branch from a snapshot
 * @param snapshotId - Snapshot ID to branch from
 * @param branchName - Name for the new branch
 * @param nodeCount - Number of nodes in the branch
 * @param edgeCount - Number of edges in the branch
 */
export async function createBranch(
  snapshotId: string,
  branchName: string,
  nodeCount: number,
  edgeCount: number
): Promise<string> {
  try {
    const id = crypto.randomUUID();
    const now = Date.now();

    const branch: Branch = {
      id,
      name: branchName,
      parentSnapshotId: snapshotId,
      createdAt: now,
      updatedAt: now,
      nodeCount,
      edgeCount,
      isActive: false,
    };

    await localforage.setItem(`${BRANCH_KEYSPACE}-${id}`, branch);

    console.log(`🌿 Branch created: ${branchName} (${id})`);
    return id;
  } catch (err) {
    console.warn("Failed to create branch:", err);
    throw err;
  }
}

/**
 * Lists all branches
 * @returns Array of branches
 */
export async function listBranches(): Promise<Branch[]> {
  try {
    const keys = await localforage.keys();
    const branchKeys = keys.filter((key) =>
      key.startsWith(`${BRANCH_KEYSPACE}-`)
    );

    const branches: Branch[] = [];
    for (const key of branchKeys) {
      const branch = await localforage.getItem<Branch>(key);
      if (branch) {
        branches.push(branch);
      }
    }

    // Sort by updated time, most recent first
    return branches.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    console.warn("Failed to list branches:", err);
    return [];
  }
}

/**
 * Gets a branch by ID
 * @param branchId - Branch ID
 * @returns Branch or null if not found
 */
export async function getBranch(branchId: string): Promise<Branch | null> {
  try {
    const branch = await localforage.getItem<Branch>(
      `${BRANCH_KEYSPACE}-${branchId}`
    );
    return branch;
  } catch (err) {
    console.warn("Failed to get branch:", err);
    return null;
  }
}

/**
 * Sets the active branch
 * @param branchId - Branch ID to activate
 */
export async function setActiveBranch(branchId: string | null): Promise<void> {
  try {
    await localforage.setItem(ACTIVE_BRANCH_KEY, branchId);
    console.log(`🌿 Active branch set: ${branchId}`);
  } catch (err) {
    console.warn("Failed to set active branch:", err);
  }
}

/**
 * Gets the currently active branch ID
 * @returns Active branch ID or null
 */
export async function getActiveBranch(): Promise<string | null> {
  try {
    const branchId = await localforage.getItem<string | null>(
      ACTIVE_BRANCH_KEY
    );
    return branchId;
  } catch (err) {
    console.warn("Failed to get active branch:", err);
    return null;
  }
}

/**
 * Updates branch metadata
 * @param branchId - Branch ID
 * @param updates - Partial branch data to update
 */
export async function updateBranch(
  branchId: string,
  updates: Partial<Branch>
): Promise<void> {
  try {
    const branch = await localforage.getItem<Branch>(
      `${BRANCH_KEYSPACE}-${branchId}`
    );
    if (!branch) {
      console.warn("Branch not found for update:", branchId);
      return;
    }

    const updatedBranch: Branch = {
      ...branch,
      ...updates,
      updatedAt: Date.now(),
    };

    await localforage.setItem(`${BRANCH_KEYSPACE}-${branchId}`, updatedBranch);
    console.log(`🌿 Branch updated: ${branchId}`);
  } catch (err) {
    console.warn("Failed to update branch:", err);
  }
}

/**
 * Deletes a branch
 * @param branchId - Branch ID to delete
 */
export async function deleteBranch(branchId: string): Promise<void> {
  try {
    const activeBranch = await getActiveBranch();

    // Clear active branch if it's being deleted
    if (activeBranch === branchId) {
      await setActiveBranch(null);
    }

    await localforage.removeItem(`${BRANCH_KEYSPACE}-${branchId}`);
    console.log(`🌿 Branch deleted: ${branchId}`);
  } catch (err) {
    console.warn("Failed to delete branch:", err);
  }
}

/**
 * Loads branch graph state from its parent snapshot
 * @param branchName - Branch name (searches by name)
 * @returns Graph state or null if not found
 */
export async function loadBranch(
  branchName: string
): Promise<GraphState | null> {
  try {
    const branches = await listBranches();
    const branch = branches.find((b) => b.name === branchName);

    if (!branch || !branch.parentSnapshotId) {
      console.warn("Branch not found or has no parent snapshot:", branchName);
      return null;
    }

    const snapshot = await loadSnapshot(branch.parentSnapshotId);
    return snapshot;
  } catch (err) {
    console.warn("Failed to load branch:", err);
    return null;
  }
}

/**
 * Merges one branch into another
 * @param sourceBranchId - Source branch ID to merge from
 * @param targetBranchId - Target branch ID to merge into
 * @returns Merged graph state or null if merge failed
 */
export async function mergeBranch(
  sourceBranchId: string,
  targetBranchId: string
): Promise<GraphState | null> {
  try {
    const sourceBranch = await getBranch(sourceBranchId);
    const targetBranch = await getBranch(targetBranchId);

    if (!sourceBranch || !targetBranch) {
      console.warn("Source or target branch not found");
      return null;
    }

    // Load both branch states
    const sourceState = sourceBranch.parentSnapshotId
      ? await loadSnapshot(sourceBranch.parentSnapshotId)
      : null;
    const targetState = targetBranch.parentSnapshotId
      ? await loadSnapshot(targetBranch.parentSnapshotId)
      : null;

    if (!sourceState || !targetState) {
      console.warn("Cannot merge: missing branch states");
      return null;
    }

    // Calculate diff and merge
    const { diffGraphs } = await import("./diffEngine");
    const diff = diffGraphs(targetState, sourceState);
    const merged = mergeGraphs(targetState, diff);

    console.log(
      `🔀 Merged branch "${sourceBranch.name}" into "${targetBranch.name}"`
    );
    console.log(
      `   Changes: +${diff.addedNodes.length} added, -${diff.removedNodes.length} removed, ~${diff.changedNodes.length} modified`
    );

    return merged;
  } catch (err) {
    console.warn("Failed to merge branches:", err);
    return null;
  }
}

/**
 * Clears all branches
 */
export async function clearBranches(): Promise<void> {
  try {
    const keys = await localforage.keys();
    const branchKeys = keys.filter((key) =>
      key.startsWith(`${BRANCH_KEYSPACE}-`)
    );

    for (const key of branchKeys) {
      await localforage.removeItem(key);
    }

    await localforage.removeItem(ACTIVE_BRANCH_KEY);
    console.log(`🗑️ Cleared ${branchKeys.length} branches`);
  } catch (err) {
    console.warn("Failed to clear branches:", err);
  }
}

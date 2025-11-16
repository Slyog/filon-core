/**
 * Workspace utilities for local snapshot detection.
 * This module intentionally does NOT import or touch the canvas session helpers.
 */

const WORKSPACE_SNAPSHOT_PREFIX = "filon.v4.workspace.";
const WORKSPACE_SNAPSHOT_SUFFIX = ".snapshot";

/**
 * Returns true if any workspace snapshot-like keys exist in sessionStorage.
 * This is a pure detector and does NOT imply auto-open behavior.
 * Implementations that want to open a workspace MUST do so explicitly via user action.
 */
export function hasAnyWorkspaceSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith(WORKSPACE_SNAPSHOT_PREFIX) &&
        key.endsWith(WORKSPACE_SNAPSHOT_SUFFIX)
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}



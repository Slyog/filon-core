"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  listBranches,
  createBranch,
  deleteBranch,
  getActiveBranch,
  setActiveBranch,
  mergeBranch,
  type Branch,
} from "@/lib/branchManager";
import {
  listSnapshots,
  loadSnapshot,
  type SnapshotMeta,
} from "@/lib/versionManager";
import BranchVisualizer from "@/components/BranchVisualizer";
import type { Node, Edge } from "reactflow";

interface BranchPanelProps {
  onRestore?: (nodes: Node[], edges: Edge[]) => void;
  currentGraphState?: { nodes: Node[]; edges: Edge[] };
  onBranchSwitch?: (branch: Branch | null) => void;
  onVisualizerToggle?: (isOpen: boolean) => void;
  onPlaybackClick?: () => void;
}

export default function BranchPanel({
  onRestore,
  currentGraphState,
  onBranchSwitch,
  onVisualizerToggle,
  onPlaybackClick,
}: BranchPanelProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(
    null
  );

  const loadBranches = useCallback(async () => {
    setLoading(true);
    const [branchesList, activeId] = await Promise.all([
      listBranches(),
      getActiveBranch(),
    ]);
    setBranches(branchesList);
    setActiveBranchId(activeId);
    setLoading(false);
  }, []);

  const loadSnapshots = useCallback(async () => {
    const list = await listSnapshots(10);
    setSnapshots(list);
  }, []);

  useEffect(() => {
    loadBranches();
    loadSnapshots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleCreateBranch = async () => {
    if (!selectedSnapshotId || !newBranchName.trim()) {
      return;
    }

    const snapshot = await loadSnapshot(selectedSnapshotId);
    if (!snapshot) return;

    const branchId = await createBranch(
      selectedSnapshotId,
      newBranchName.trim(),
      snapshot.nodes?.length ?? 0,
      snapshot.edges?.length ?? 0
    );

    // Activate the new branch
    await setActiveBranch(branchId);
    await loadBranches();

    // Restore the snapshot
    if (onRestore && snapshot) {
      onRestore(snapshot.nodes ?? [], snapshot.edges ?? []);
    }

    // Notify parent
    const activeBranch = branches.find((b) => b.id === branchId);
    onBranchSwitch?.(activeBranch || null);

    console.log("🌱 Branch created");
    setShowCreateDialog(false);
    setNewBranchName("");
    setSelectedSnapshotId(null);
  };

  const handleSwitchBranch = async (branchId: string) => {
    await setActiveBranch(branchId);
    setActiveBranchId(branchId);

    const branch = branches.find((b) => b.id === branchId);
    if (branch && branch.parentSnapshotId) {
      const snapshot = await loadSnapshot(branch.parentSnapshotId);
      if (snapshot && onRestore) {
        onRestore(snapshot.nodes ?? [], snapshot.edges ?? []);
      }
    }

    onBranchSwitch?.(branch || null);
  };

  const handleMergeBranch = async (sourceBranchId: string) => {
    if (!activeBranchId) {
      alert("No active branch to merge into. Please switch to a branch first.");
      return;
    }

    const sourceBranch = branches.find((b) => b.id === sourceBranchId);
    const targetBranch = branches.find((b) => b.id === activeBranchId);

    if (!sourceBranch || !targetBranch) return;

    if (
      !window.confirm(
        `Merge "${sourceBranch.name}" into "${targetBranch.name}"?`
      )
    ) {
      return;
    }

    try {
      const mergedState = await mergeBranch(sourceBranchId, activeBranchId);

      if (mergedState && onRestore) {
        onRestore(mergedState.nodes ?? [], mergedState.edges ?? []);
        console.log("🌿 Branch merged successfully");
      }

      await loadBranches();
    } catch (err) {
      console.error("Failed to merge branch:", err);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this branch? This cannot be undone."
      )
    ) {
      return;
    }

    await deleteBranch(branchId);
    await loadBranches();

    console.log("🗑️ Branch deleted");

    // If we deleted the active branch, clear active
    if (activeBranchId === branchId) {
      await setActiveBranch(null);
      setActiveBranchId(null);
      onBranchSwitch?.(null);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="absolute top-12 left-4 z-50 w-96 bg-zinc-900/95 backdrop-blur-sm border-2 border-green-400/30 rounded-2xl shadow-2xl overflow-hidden"
      style={{ boxShadow: "0 0 20px rgba(74, 222, 128, 0.15)" }}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-700 bg-linear-to-r from-green-900/20 to-emerald-900/20">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          Branches
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Create and manage parallel development paths
        </p>
      </div>

      {/* Create Branch Dialog */}
      <AnimatePresence>
        {showCreateDialog && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-zinc-700 bg-zinc-800/50"
          >
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="e.g., experimental-feature"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-400/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">
                  From Snapshot
                </label>
                <select
                  value={selectedSnapshotId || ""}
                  onChange={(e) => setSelectedSnapshotId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm"
                >
                  <option value="">Select a snapshot...</option>
                  {snapshots.map((snapshot) => (
                    <option key={snapshot.id} value={snapshot.id}>
                      {formatTimeAgo(snapshot.timestamp)} - {snapshot.nodeCount}{" "}
                      nodes
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateBranch}
                  disabled={!selectedSnapshotId || !newBranchName.trim()}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Create Branch
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowCreateDialog(false);
                    setNewBranchName("");
                    setSelectedSnapshotId(null);
                  }}
                  className="flex-1 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Branch List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-zinc-400 text-sm">
            Loading branches...
          </div>
        ) : branches.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-sm">
            <div className="text-4xl mb-2">🌱</div>
            No branches yet
            <div className="text-xs mt-1">Create one to get started</div>
          </div>
        ) : (
          <AnimatePresence>
            {branches.map((branch, index) => (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`border-b border-zinc-800 last:border-b-0 hover:bg-zinc-800/50 transition-colors ${
                  activeBranchId === branch.id
                    ? "bg-green-900/20 border-l-2 border-l-green-400"
                    : ""
                }`}
              >
                <div className="p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {activeBranchId === branch.id && (
                        <span className="text-green-400 text-xs">●</span>
                      )}
                      <span className="text-white text-xs font-semibold truncate">
                        {branch.name}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {branch.nodeCount} nodes •{" "}
                      {formatTimeAgo(branch.updatedAt)}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {activeBranchId !== branch.id && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSwitchBranch(branch.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          Switch
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleMergeBranch(branch.id)}
                          className="px-2 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          Merge
                        </motion.button>
                      </>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteBranch(branch.id)}
                      className="px-2 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      🗑️
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-zinc-700 bg-zinc-900/50 flex gap-2 flex-wrap">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            const newState = !showVisualizer;
            setShowVisualizer(newState);
            onVisualizerToggle?.(newState);
          }}
          className={`flex-1 px-3 py-2 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm ${
            showVisualizer
              ? "bg-blue-600 hover:bg-blue-500"
              : "bg-blue-700 hover:bg-blue-600"
          }`}
        >
          🧩 Visualizer
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            onPlaybackClick?.();
            console.log("⏳ Playback started");
          }}
          className="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          ▶ Playback
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateDialog(!showCreateDialog)}
          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          ➕ New Branch
        </motion.button>
      </div>

      {/* Branch Visualizer */}
      <AnimatePresence>
        {showVisualizer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-t border-zinc-700 overflow-hidden"
          >
            <BranchVisualizer currentGraphState={currentGraphState} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

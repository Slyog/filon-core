"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  listBranches,
  getActiveBranch,
  type Branch,
} from "@/lib/branchManager";
import {
  listSnapshots,
  loadSnapshot,
  type SnapshotMeta,
} from "@/lib/versionManager";
import { diffGraphs, type DiffResult } from "@/lib/diffEngine";
import DiffModal from "@/components/DiffModal";
import type { Node, Edge } from "reactflow";

interface BranchVisualizerProps {
  currentGraphState?: { nodes: Node[]; edges: Edge[] };
  onClose?: () => void;
}

export default function BranchVisualizer({
  currentGraphState,
  onClose,
}: BranchVisualizerProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotMeta | null>(
    null
  );
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [showDiffModal, setShowDiffModal] = useState(false);

  const [currentTime] = useState(() => Date.now());

  const loadData = useCallback(async () => {
    setLoading(true);
    const [branchesList, snapshotsList, activeId] = await Promise.all([
      listBranches(),
      listSnapshots(20), // Load more for visualizer
      getActiveBranch(),
    ]);
    setBranches(branchesList);
    setSnapshots(snapshotsList);
    setActiveBranchId(activeId);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const formatTimeAgo = (timestamp: number) => {
    const now = currentTime;
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleSnapshotClick = async (snapshot: SnapshotMeta) => {
    if (!currentGraphState) {
      console.warn("No current state to compare");
      return;
    }

    try {
      const snapshotData = await loadSnapshot(snapshot.id);
      if (!snapshotData) return;

      const diff = diffGraphs(currentGraphState, {
        nodes: snapshotData.nodes ?? [],
        edges: snapshotData.edges ?? [],
      });

      setSelectedSnapshot(snapshot);
      setDiffResult(diff);
      setShowDiffModal(true);
    } catch (err) {
      console.error("Failed to open diff:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <div className="text-2xl mb-2">⏳</div>
        Loading timeline...
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="text-lg">🧩</span>
          Timeline Visualizer
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Close Visualizer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-6 max-h-[500px] overflow-y-auto">
        {branches.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <div className="text-3xl mb-2">🌱</div>
            No branches to visualize
          </div>
        ) : (
          branches.map((branch, index) => {
            const isActive = activeBranchId === branch.id;
            const branchSnapshots = snapshots.filter(
              (s) => s.branchId === branch.id
            );

            return (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative"
              >
                {/* Branch Line */}
                <div className="flex items-start gap-3">
                  {/* Vertical Timeline Line */}
                  <div className="relative flex flex-col items-center">
                    {/* Branch Start Marker */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                      className={`w-4 h-4 rounded-full ${
                        isActive
                          ? "bg-cyan-500 border-2 border-cyan-300"
                          : "bg-zinc-600 border-2 border-zinc-500"
                      }`}
                      style={
                        isActive
                          ? {
                              boxShadow: "0 0 12px rgba(47, 243, 255, 0.6)",
                            }
                          : {}
                      }
                    />

                    {/* Vertical Line */}
                    {branchSnapshots.length > 0 && (
                      <div
                        className={`w-0.5 ${
                          isActive ? "border-cyan-400" : "border-zinc-600"
                        }`}
                        style={{
                          height: `${Math.max(
                            40,
                            branchSnapshots.length * 50
                          )}px`,
                          borderLeft: isActive
                            ? "2px solid #2FF3FF"
                            : "2px solid #52525b",
                        }}
                      />
                    )}
                  </div>

                  {/* Branch Info */}
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      {isActive && (
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [1, 0.7, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="w-2 h-2 rounded-full bg-cyan-400"
                        />
                      )}
                      <span
                        className={`text-sm font-semibold truncate ${
                          isActive ? "text-cyan-300" : "text-white"
                        }`}
                      >
                        {branch.name}
                      </span>
                      {isActive && (
                        <span className="text-xs text-cyan-400">● Active</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {branch.nodeCount} nodes •{" "}
                      {formatTimeAgo(branch.updatedAt)}
                    </div>

                    {/* Snapshot Dots */}
                    {branchSnapshots.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {branchSnapshots.map((snapshot, snapIndex) => (
                          <motion.button
                            key={snapshot.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.2,
                              delay: index * 0.1 + snapIndex * 0.05 + 0.3,
                            }}
                            whileHover={{ scale: 1.1 }}
                            onClick={() => handleSnapshotClick(snapshot)}
                            className="flex items-center gap-2 w-full text-left hover:bg-zinc-800/50 px-2 py-1 rounded transition-colors group"
                          >
                            {/* Snapshot Dot */}
                            <motion.div
                              animate={{
                                scale: [1, 1.1, 1],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: snapIndex * 0.1,
                              }}
                              className={`w-2 h-2 rounded-full ${
                                isActive ? "bg-cyan-400" : "bg-zinc-500"
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-zinc-400 group-hover:text-zinc-200">
                                {formatTimeAgo(snapshot.timestamp)}
                              </div>
                              <div className="text-xs text-zinc-600">
                                {snapshot.nodeCount} nodes
                              </div>
                            </div>
                            <span className="text-zinc-600 group-hover:text-zinc-400 text-xs">
                              →
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Diff Modal */}
      {showDiffModal && diffResult && selectedSnapshot && (
        <DiffModal
          diff={diffResult}
          onClose={() => {
            setShowDiffModal(false);
            setDiffResult(null);
            setSelectedSnapshot(null);
          }}
        />
      )}
    </div>
  );
}

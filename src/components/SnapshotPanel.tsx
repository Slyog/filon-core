"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  listSnapshots,
  loadSnapshot,
  type SnapshotMeta,
} from "@/lib/versionManager";
import { diffGraphs, mergeGraphs, type DiffResult } from "@/lib/diffEngine";
import DiffModal from "@/components/DiffModal";
import type { Node, Edge } from "reactflow";

interface SnapshotPanelProps {
  onRestore?: (nodes: Node[], edges: Edge[]) => void;
  currentGraphState?: { nodes: Node[]; edges: Edge[] };
  onDiffChange?: (diff: DiffResult | null) => void;
}

export default function SnapshotPanel({
  onRestore,
  currentGraphState,
  onDiffChange,
}: SnapshotPanelProps) {
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDiffPanel, setShowDiffPanel] = useState(false);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [selectedSnapshotData, setSelectedSnapshotData] = useState<{
    nodes: Node[];
    edges: Edge[];
  } | null>(null);
  const [currentTime] = useState(() => Date.now());

  const loadSnapshotsList = useCallback(async () => {
    setLoading(true);
    const list = await listSnapshots(5);
    setSnapshots(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSnapshotsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Clear diff highlighting when component unmounts
  useEffect(() => {
    return () => {
      onDiffChange?.(null);
    };
  }, [onDiffChange]);

  const handleRestore = async (id: string) => {
    const snapshotData = await loadSnapshot(id);
    if (snapshotData && onRestore) {
      onRestore(snapshotData.nodes ?? [], snapshotData.edges ?? []);
      // Reload list to reflect any changes
      await loadSnapshotsList();
    }
  };

  const handleCompare = async (id: string) => {
    try {
      const snapshotData = await loadSnapshot(id);
      if (!snapshotData || !currentGraphState) {
        console.warn("Cannot compare: missing snapshot or current state");
        return;
      }

      // Store snapshot data for merge
      setSelectedSnapshotData({
        nodes: snapshotData.nodes ?? [],
        edges: snapshotData.edges ?? [],
      });

      // Compare snapshot to current state (what changed since snapshot)
      const diff = diffGraphs(
        { nodes: snapshotData.nodes ?? [], edges: snapshotData.edges ?? [] },
        currentGraphState
      );

      setDiffResult(diff);
      setShowDiffPanel(true);
      // Notify parent to apply diff highlighting
      onDiffChange?.(diff);
    } catch (err) {
      console.error("Failed to calculate diff:", err);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = currentTime - timestamp;
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
      className="absolute top-12 right-4 z-50 w-80 bg-zinc-900/95 backdrop-blur-sm border-2 border-purple-400/30 rounded-2xl shadow-2xl overflow-hidden"
      style={{ boxShadow: "0 0 20px rgba(192, 132, 252, 0.15)" }}
    >
      <div className="p-4 border-b border-zinc-700">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="text-xl">📜</span>
          Version Timeline
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          {snapshots.length > 0
            ? `${snapshots.length} snapshot${
                snapshots.length !== 1 ? "s" : ""
              } available`
            : "No snapshots yet"}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-zinc-400 text-sm">
            Loading...
          </div>
        ) : snapshots.length === 0 ? (
          <div className="p-6 text-center text-zinc-400 text-sm">
            No snapshots yet. <br />
            Snapshots are created automatically every ~5 minutes.
          </div>
        ) : (
          <AnimatePresence>
            {snapshots.map((snapshot, index) => (
              <motion.div
                key={snapshot.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="border-b border-zinc-800 last:border-b-0 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-zinc-400 text-xs">🕒</span>
                      <span className="text-white text-xs font-medium">
                        {formatTimeAgo(snapshot.timestamp)}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {snapshot.nodeCount} nodes • {snapshot.edgeCount} edges
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCompare(snapshot.id)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                      disabled={!currentGraphState}
                    >
                      Compare
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRestore(snapshot.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                    >
                      Restore
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="p-3 border-t border-zinc-700 bg-zinc-900/50">
        <button
          onClick={loadSnapshotsList}
          className="w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Diff Modal */}
      {showDiffPanel && diffResult && (
        <DiffModal
          diff={diffResult}
          onClose={() => {
            setShowDiffPanel(false);
            setDiffResult(null);
            setSelectedSnapshotData(null);
            onDiffChange?.(null);
          }}
          onMerge={() => {
            if (
              onRestore &&
              currentGraphState &&
              selectedSnapshotData &&
              diffResult
            ) {
              // Merge snapshot changes into current state
              const merged = mergeGraphs(currentGraphState, diffResult);
              onRestore(merged.nodes ?? [], merged.edges ?? []);
              setShowDiffPanel(false);
              setDiffResult(null);
              setSelectedSnapshotData(null);
              onDiffChange?.(null);
            }
          }}
        />
      )}
    </motion.div>
  );
}

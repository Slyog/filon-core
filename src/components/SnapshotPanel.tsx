"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  listSnapshots,
  loadSnapshot,
  type SnapshotMeta,
} from "@/lib/versionManager";
import type { Node, Edge } from "reactflow";

interface SnapshotPanelProps {
  onRestore?: (nodes: Node[], edges: Edge[]) => void;
}

export default function SnapshotPanel({ onRestore }: SnapshotPanelProps) {
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSnapshotsList();
  }, []);

  const loadSnapshotsList = async () => {
    setLoading(true);
    const list = await listSnapshots(5);
    setSnapshots(list);
    setLoading(false);
  };

  const handleRestore = async (id: string) => {
    const snapshotData = await loadSnapshot(id);
    if (snapshotData && onRestore) {
      onRestore(snapshotData.nodes ?? [], snapshotData.edges ?? []);
      // Reload list to reflect any changes
      await loadSnapshotsList();
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
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
                  <button
                    onClick={() => handleRestore(snapshot.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shrink-0"
                  >
                    Restore
                  </button>
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
    </motion.div>
  );
}

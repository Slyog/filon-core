"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { diffGraphs } from "@/lib/diffEngine";
import { mergeSnapshots } from "@/lib/snapshotDiff";
import type { DiffResult } from "@/lib/diffEngine";
import type { Node, Edge } from "reactflow";

interface DiffPanelProps {
  baseNodes: Node[];
  baseEdges: Edge[];
  onClose: () => void;
  onApplyDiff?: (nodes: Node[], edges: Edge[]) => void;
}

export default function DiffPanel({
  baseNodes,
  baseEdges,
  onClose,
  onApplyDiff,
}: DiffPanelProps) {
  const [selectedSnapshot, setSelectedSnapshot] = useState<{
    nodes: Node[];
    edges: Edge[];
    timestamp: number;
  } | null>(null);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [mergeStrategy, setMergeStrategy] = useState<
    "preferIncoming" | "preferBase" | "combine"
  >("combine");

  const handleCompare = useCallback(() => {
    if (!selectedSnapshot) return;

    const diff = diffGraphs(
      { nodes: baseNodes, edges: baseEdges },
      { nodes: selectedSnapshot.nodes, edges: selectedSnapshot.edges }
    );
    setDiffResult(diff);
  }, [baseNodes, baseEdges, selectedSnapshot]);

  const handleMerge = useCallback(() => {
    if (!selectedSnapshot || !onApplyDiff) return;

    const merged = mergeSnapshots(
      { nodes: baseNodes, edges: baseEdges },
      { nodes: selectedSnapshot.nodes, edges: selectedSnapshot.edges },
      mergeStrategy
    );

    onApplyDiff(merged.nodes, merged.edges);
    onClose();
  }, [
    baseNodes,
    baseEdges,
    selectedSnapshot,
    mergeStrategy,
    onApplyDiff,
    onClose,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-2xl bg-zinc-900 border-2 border-purple-400/30 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]"
        style={{ boxShadow: "0 0 40px rgba(192, 132, 252, 0.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-700 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="text-2xl">🧬</span>
              Diff & Merge Preview
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <span className="text-zinc-400 text-xl">✕</span>
            </button>
          </div>
          <p className="text-sm text-zinc-400 mt-2">
            Compare and merge with a snapshot
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Snapshot Selector Placeholder */}
          {!selectedSnapshot && (
            <div className="text-center py-12">
              <p className="text-zinc-400 text-sm mb-4">
                Select a snapshot to compare with current state
              </p>
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg">
                Load Snapshot
              </button>
            </div>
          )}

          {/* Diff Results */}
          {diffResult && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                    <div className="text-emerald-400 text-2xl mb-2">
                      +{diffResult.addedNodes.length}
                    </div>
                    <div className="text-white text-sm font-semibold">
                      Added
                    </div>
                  </div>
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <div className="text-red-400 text-2xl mb-2">
                      -{diffResult.removedNodes.length}
                    </div>
                    <div className="text-white text-sm font-semibold">
                      Removed
                    </div>
                  </div>
                  <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                    <div className="text-amber-400 text-2xl mb-2">
                      ~{diffResult.changedNodes.length}
                    </div>
                    <div className="text-white text-sm font-semibold">
                      Modified
                    </div>
                  </div>
                </div>

                {/* Detailed Changes */}
                {diffResult.addedNodes.length > 0 && (
                  <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-lg p-4">
                    <h4 className="text-emerald-400 font-semibold mb-2">
                      Added Nodes
                    </h4>
                    <div className="space-y-1">
                      {diffResult.addedNodes.map((node) => (
                        <div key={node.id} className="text-zinc-300 text-xs">
                          • {node.data?.label || node.id}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {diffResult.removedNodes.length > 0 && (
                  <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-4">
                    <h4 className="text-red-400 font-semibold mb-2">
                      Removed Nodes
                    </h4>
                    <div className="space-y-1">
                      {diffResult.removedNodes.map((node) => (
                        <div key={node.id} className="text-zinc-300 text-xs">
                          • {node.data?.label || node.id}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {diffResult.changedNodes.length > 0 && (
                  <div className="bg-amber-900/10 border border-amber-500/20 rounded-lg p-4">
                    <h4 className="text-amber-400 font-semibold mb-2">
                      Modified Nodes
                    </h4>
                    <div className="space-y-1">
                      {diffResult.changedNodes.map((change) => (
                        <div key={change.id} className="text-zinc-300 text-xs">
                          • {change.before.data?.label || change.id} →{" "}
                          {change.after.data?.label || change.id}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {diffResult.addedEdges.length > 0 && (
                  <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
                    <h4 className="text-blue-400 font-semibold mb-2">
                      Added Edges ({diffResult.addedEdges.length})
                    </h4>
                  </div>
                )}

                {diffResult.removedEdges.length > 0 && (
                  <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-4">
                    <h4 className="text-red-400 font-semibold mb-2">
                      Removed Edges ({diffResult.removedEdges.length})
                    </h4>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer Actions */}
        {diffResult && (
          <div className="p-6 border-t border-zinc-700 bg-zinc-900/50 space-y-3">
            {/* Merge Strategy Selector */}
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm text-zinc-400">Merge Strategy:</label>
              <select
                value={mergeStrategy}
                onChange={(e) =>
                  setMergeStrategy(
                    e.target.value as
                      | "preferIncoming"
                      | "preferBase"
                      | "combine"
                  )
                }
                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
              >
                <option value="combine">Combine Both</option>
                <option value="preferIncoming">Prefer Snapshot</option>
                <option value="preferBase">Prefer Current</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMerge}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-semibold"
              >
                Merge Changes
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

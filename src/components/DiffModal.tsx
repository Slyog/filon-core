"use client";
import { motion } from "framer-motion";
import type { DiffResult } from "@/lib/diffEngine";

interface DiffModalProps {
  diff: DiffResult;
  onMerge?: () => void;
  onClose?: () => void;
}

export default function DiffModal({ diff, onMerge, onClose }: DiffModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Diff Preview"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-3xl bg-zinc-900 border-2 border-purple-400/30 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]"
        style={{ boxShadow: "0 0 40px rgba(192, 132, 252, 0.2)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-700 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <span className="text-2xl">🧬</span>
            Graph Differences
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Review changes between snapshot and current state
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 text-center">
              <div className="text-emerald-400 text-3xl font-bold mb-1">
                +{diff.addedNodes.length}
              </div>
              <div className="text-white text-sm font-semibold">Added</div>
            </div>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
              <div className="text-red-400 text-3xl font-bold mb-1">
                -{diff.removedNodes.length}
              </div>
              <div className="text-white text-sm font-semibold">Removed</div>
            </div>
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 text-center">
              <div className="text-amber-400 text-3xl font-bold mb-1">
                ~{diff.changedNodes.length}
              </div>
              <div className="text-white text-sm font-semibold">Modified</div>
            </div>
          </div>

          {/* Added Nodes */}
          {diff.addedNodes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 bg-emerald-900/10 border border-emerald-500/20 rounded-lg p-4"
            >
              <h3 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                <span>🟢</span>
                Added Nodes ({diff.addedNodes.length})
              </h3>
              <div className="space-y-2">
                {diff.addedNodes.map((node) => (
                  <div
                    key={node.id}
                    className="text-zinc-300 text-sm py-1 px-2 bg-zinc-800/30 rounded"
                  >
                    •{" "}
                    <span className="font-medium">
                      {node.data?.label || node.id}
                    </span>
                    <span className="text-zinc-500 text-xs ml-2">
                      ({node.id})
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Removed Nodes */}
          {diff.removedNodes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 bg-red-900/10 border border-red-500/20 rounded-lg p-4"
            >
              <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                <span>🔴</span>
                Removed Nodes ({diff.removedNodes.length})
              </h3>
              <div className="space-y-2">
                {diff.removedNodes.map((node) => (
                  <div
                    key={node.id}
                    className="text-zinc-300 text-sm py-1 px-2 bg-zinc-800/30 rounded"
                  >
                    •{" "}
                    <span className="font-medium">
                      {node.data?.label || node.id}
                    </span>
                    <span className="text-zinc-500 text-xs ml-2">
                      ({node.id})
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Changed Nodes */}
          {diff.changedNodes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 bg-amber-900/10 border border-amber-500/20 rounded-lg p-4"
            >
              <h3 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
                <span>🟡</span>
                Changed Nodes ({diff.changedNodes.length})
              </h3>
              <div className="space-y-2">
                {diff.changedNodes.map((change) => (
                  <div
                    key={change.id}
                    className="text-zinc-300 text-sm py-1 px-2 bg-zinc-800/30 rounded"
                  >
                    •{" "}
                    <span className="font-medium">
                      {change.before.data?.label || change.id}
                    </span>
                    <span className="text-zinc-500 mx-2">→</span>
                    <span className="font-medium">
                      {change.after.data?.label || change.id}
                    </span>
                    <span className="text-zinc-500 text-xs ml-2">
                      ({change.id})
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Edge Changes Summary */}
          {(diff.addedEdges.length > 0 || diff.removedEdges.length > 0) && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4"
            >
              <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                <span>🔗</span>
                Edge Changes
              </h3>
              <div className="text-zinc-300 text-sm">
                {diff.addedEdges.length > 0 && (
                  <div className="text-emerald-400">
                    +{diff.addedEdges.length} added
                  </div>
                )}
                {diff.removedEdges.length > 0 && (
                  <div className="text-red-400">
                    -{diff.removedEdges.length} removed
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* No Changes Message */}
          {diff.addedNodes.length === 0 &&
            diff.removedNodes.length === 0 &&
            diff.changedNodes.length === 0 &&
            diff.addedEdges.length === 0 &&
            diff.removedEdges.length === 0 && (
              <div className="text-center py-8 text-zinc-400">
                <div className="text-4xl mb-3">✨</div>
                <div className="text-lg font-semibold">
                  No differences found
                </div>
                <div className="text-sm">
                  Snapshot and current state are identical
                </div>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-700 bg-zinc-900/50 flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </motion.button>
          {onMerge && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onMerge}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-semibold"
            >
              Merge into Current Graph
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

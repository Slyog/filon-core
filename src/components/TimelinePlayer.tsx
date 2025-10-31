"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  listSnapshots,
  loadSnapshot,
  type SnapshotMeta,
} from "@/lib/versionManager";
import type { GraphState } from "@/lib/sessionManager";

interface TimelinePlayerProps {
  onSnapshotChange?: (snapshot: GraphState) => void;
  initialSnapshotId?: string;
  onClose?: () => void;
}

type PlaybackState = "stopped" | "playing" | "paused";

export default function TimelinePlayer({
  onSnapshotChange,
  initialSnapshotId,
  onClose,
}: TimelinePlayerProps) {
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playbackState, setPlaybackState] = useState<PlaybackState>("stopped");
  const [loading, setLoading] = useState(true);
  const playbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const loadSnapshots = useCallback(async () => {
    setLoading(true);
    const list = await listSnapshots(50); // Load more for playback
    const sortedList = list.sort((a, b) => a.timestamp - b.timestamp); // Oldest first
    setSnapshots(sortedList);

    // Find initial snapshot index if provided
    if (initialSnapshotId) {
      const index = sortedList.findIndex((s) => s.id === initialSnapshotId);
      setCurrentIndex(index >= 0 ? index : 0);
    } else {
      setCurrentIndex(0);
    }

    setLoading(false);
  }, [initialSnapshotId]);

  useEffect(() => {
    loadSnapshots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  const loadCurrentSnapshot = useCallback(async () => {
    if (currentIndex < 0 || currentIndex >= snapshots.length) return;

    const snapshot = snapshots[currentIndex];
    if (!snapshot) return;

    const data = await loadSnapshot(snapshot.id);
    if (data && onSnapshotChange) {
      onSnapshotChange(data);
    }
  }, [currentIndex, snapshots, onSnapshotChange]);

  // Load snapshot when index changes
  useEffect(() => {
    if (snapshots.length > 0 && currentIndex >= 0) {
      void loadCurrentSnapshot();
    }
  }, [currentIndex, snapshots.length, loadCurrentSnapshot]);

  const startPlayback = () => {
    if (currentIndex >= snapshots.length - 1) {
      // Reset to beginning if at end
      setCurrentIndex(0);
    }

    setPlaybackState("playing");

    playbackIntervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= snapshots.length - 1) {
          // Stop at end
          setPlaybackState("stopped");
          if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
          }
          return prev;
        }
        return prev + 1;
      });
    }, 800); // 800ms per snapshot
  };

  const pausePlayback = () => {
    setPlaybackState("paused");
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
  };

  const stopPlayback = () => {
    setPlaybackState("stopped");
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
    setCurrentIndex(0);
  };

  const playPauseToggle = () => {
    if (playbackState === "playing") {
      pausePlayback();
    } else if (playbackState === "paused") {
      startPlayback();
    } else {
      startPlayback();
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(snapshots.length - 1, prev + 1));
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Timeline Playback"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full max-w-[600px] bg-zinc-900/95 backdrop-blur-sm border-2 border-blue-400/30 rounded-2xl shadow-2xl overflow-hidden"
      style={{ boxShadow: "0 0 20px rgba(59, 130, 246, 0.15)" }}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-700 bg-linear-to-r from-blue-900/20 to-cyan-900/20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">⏳</span>
            Timeline Playback
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors"
              aria-label="Close Playback"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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
        {!loading && snapshots.length > 0 && (
          <div className="mt-2 text-xs text-zinc-400">
            {currentIndex + 1} of {snapshots.length} snapshots •{" "}
            {snapshots[currentIndex] &&
              formatTimestamp(snapshots[currentIndex].timestamp)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8 text-zinc-400">
            <div className="text-3xl mb-2">⏳</div>
            Loading timeline...
          </div>
        ) : snapshots.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <div className="text-3xl mb-2">📽️</div>
            No snapshots to play
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                <span>Progress</span>
                <span>{((currentIndex + 1) / snapshots.length) * 100}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentIndex + 1) / snapshots.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Current Snapshot Info */}
            {snapshots[currentIndex] && (
              <div className="mb-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">
                    Current Snapshot
                  </span>
                  <span className="text-xs text-zinc-400">
                    {formatTimestamp(snapshots[currentIndex].timestamp)}
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  {snapshots[currentIndex].nodeCount} nodes •{" "}
                  {snapshots[currentIndex].edgeCount} edges
                </div>
              </div>
            )}

            {/* Timeline Steps */}
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {snapshots.map((snapshot, index) => (
                <motion.div
                  key={snapshot.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    index === currentIndex
                      ? "bg-blue-900/30 border-blue-500"
                      : "bg-zinc-800/30 border-zinc-700 hover:border-zinc-600"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Snapshot {index + 1}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {snapshot.nodeCount} nodes
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400">
                      {formatTimestamp(snapshot.timestamp)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-zinc-700 bg-zinc-900/50">
        <div className="flex items-center justify-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopPlayback}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors"
            aria-label="Stop Playback"
          >
            ⏹ Stop
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToPrevious}
            disabled={currentIndex === 0 || playbackState === "playing"}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            aria-label="Previous Snapshot"
          >
            ⏪ Prev
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={playPauseToggle}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-lg font-semibold rounded-lg transition-colors shadow-md"
            aria-label={
              playbackState === "playing" ? "Pause Playback" : "Start Playback"
            }
          >
            {playbackState === "playing" ? "⏸ Pause" : "▶ Play"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToNext}
            disabled={
              currentIndex >= snapshots.length - 1 ||
              playbackState === "playing"
            }
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            aria-label="Next Snapshot"
          >
            ⏩ Next
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAutosaveQueue } from "@/hooks/useAutosaveQueue";
import { isOnline } from "@/utils/network";
import { getRecentTelemetry } from "@/utils/telemetryLogger";
import type { TelemetryLog } from "@/store/db";

interface SyncDashboardProps {
  sessionId: string | null;
  onClose?: () => void;
}

const MAX_RETRIES = 5;

export default function SyncDashboard({
  sessionId,
  onClose,
}: SyncDashboardProps) {
  const {
    queue,
    queueSize,
    isSyncing,
    lastSyncTime,
    lastError,
    totalRetries,
    successCount,
    errorCount,
    forceSync,
  } = useAutosaveQueue(sessionId);

  const [isOnlineStatus, setIsOnlineStatus] = useState(true);
  const [currentJobRetries, setCurrentJobRetries] = useState(0);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);

  // Update online status
  useEffect(() => {
    setIsOnlineStatus(isOnline());
    const interval = setInterval(() => setIsOnlineStatus(isOnline()), 2000);
    return () => clearInterval(interval);
  }, []);

  // Get current job retry count
  useEffect(() => {
    if (queue.length > 0) {
      setCurrentJobRetries(queue[0].retryCount || 0);
    } else {
      setCurrentJobRetries(0);
    }
  }, [queue]);

  // Load telemetry logs
  useEffect(() => {
    const load = async () => {
      const recentLogs = await getRecentTelemetry(10);
      setLogs(recentLogs);
    };

    load(); // Load immediately
    const interval = setInterval(load, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Format time ago
  const formatTimeAgo = (timestamp: number | null): string => {
    if (!timestamp) return "Never";
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Calculate success rate
  const successRate = useMemo(() => {
    const total = successCount + errorCount;
    if (total === 0) return 0;
    return Math.round((successCount / total) * 100);
  }, [successCount, errorCount]);

  // Get pending jobs details
  const pendingJobsDetails = useMemo(() => {
    return queue.slice(0, 3).map((job) => ({
      id: job.id.split("-").pop()?.substring(0, 8) || "unknown",
      age: formatTimeAgo(job.createdAt),
      retries: job.retryCount,
    }));
  }, [queue]);

  if (!sessionId) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-20 right-6 z-[9998] w-80 rounded-xl border border-cyan-700/40 bg-neutral-900/95 p-4 text-cyan-100 shadow-2xl backdrop-blur-md"
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between border-b border-cyan-800/50 pb-2">
          <h3 className="text-sm font-semibold text-cyan-200">
            🔧 Sync Monitor
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-cyan-500/70 hover:text-cyan-400 transition-colors text-xs"
              aria-label="Close dashboard"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Overview */}
        <div className="space-y-2 text-xs">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-cyan-400/80">Status:</span>
            <span
              className={`font-medium ${
                isSyncing
                  ? "text-sky-400"
                  : queueSize > 0
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {isSyncing
                ? "🔄 Syncing…"
                : queueSize > 0
                ? "⏳ Queued"
                : "✅ Idle"}
            </span>
          </div>

          {/* Online Status */}
          <div className="flex items-center justify-between">
            <span className="text-cyan-400/80">Network:</span>
            <span
              className={`font-medium ${
                isOnlineStatus ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isOnlineStatus ? "🟢 Online" : "🔴 Offline"}
            </span>
          </div>

          {/* Queue Size */}
          <div className="flex items-center justify-between">
            <span className="text-cyan-400/80">Queue:</span>
            <span className="font-medium text-cyan-200">{queueSize}</span>
          </div>

          {/* Current Job Retries */}
          {queueSize > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-cyan-400/80">Current Retries:</span>
              <span
                className={`font-medium ${
                  currentJobRetries >= 3 ? "text-rose-400" : "text-amber-400"
                }`}
              >
                {currentJobRetries}/{MAX_RETRIES}
              </span>
            </div>
          )}

          {/* Last Sync */}
          <div className="flex items-center justify-between">
            <span className="text-cyan-400/80">Last Sync:</span>
            <span className="font-medium text-cyan-200">
              {lastSyncTime ? formatTimeAgo(lastSyncTime) : "Never"}
            </span>
          </div>

          {/* Total Retries */}
          <div className="flex items-center justify-between">
            <span className="text-cyan-400/80">Total Retries:</span>
            <span className="font-medium text-cyan-200">{totalRetries}</span>
          </div>

          {/* Success Rate */}
          <div className="flex items-center justify-between">
            <span className="text-cyan-400/80">Success Rate:</span>
            <span
              className={`font-medium ${
                successRate >= 90
                  ? "text-emerald-400"
                  : successRate >= 70
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {successRate}% ({successCount}/{successCount + errorCount || 0})
            </span>
          </div>

          {/* Last Error */}
          {lastError && (
            <div className="mt-2 rounded-md bg-rose-900/30 border border-rose-700/50 p-2">
              <div className="text-rose-400 text-xs font-medium mb-1">
                Last Error:
              </div>
              <div className="text-rose-300/80 text-xs break-words">
                {lastError.length > 60
                  ? `${lastError.substring(0, 60)}...`
                  : lastError}
              </div>
            </div>
          )}

          {/* Pending Jobs */}
          {pendingJobsDetails.length > 0 && (
            <div className="mt-2 rounded-md bg-cyan-900/20 border border-cyan-700/30 p-2">
              <div className="text-cyan-400 text-xs font-medium mb-1">
                Pending Jobs:
              </div>
              <div className="space-y-1">
                {pendingJobsDetails.map((job, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-cyan-200/70 flex justify-between"
                  >
                    <span>#{job.id}</span>
                    <span>{job.age}</span>
                    {job.retries > 0 && (
                      <span className="text-amber-400">{job.retries}R</span>
                    )}
                  </div>
                ))}
                {queueSize > 3 && (
                  <div className="text-xs text-cyan-400/60">
                    +{queueSize - 3} more...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2 border-t border-cyan-800/50 pt-3">
          <button
            onClick={forceSync}
            disabled={isSyncing || !isOnlineStatus}
            className="flex-1 rounded-md bg-cyan-700 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? "Syncing..." : "Force Sync Now"}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-zinc-700 px-2 py-1.5 text-xs font-medium text-cyan-100 transition-colors hover:bg-zinc-600"
          >
            Refresh
          </button>
        </div>

        {/* Telemetry Logs */}
        <div className="mt-3 border-t border-cyan-800/30 pt-2">
          <div className="mb-1 text-xs font-semibold text-cyan-400/80">
            Recent Logs:
          </div>
          <div className="max-h-40 overflow-y-auto text-xs font-mono">
            {logs.length === 0 ? (
              <div className="text-cyan-500/50 text-xs py-2">
                No logs yet...
              </div>
            ) : (
              logs.map((log) => {
                const typeColors: Record<string, string> = {
                  commit_start: "text-sky-400",
                  commit_success: "text-emerald-400",
                  retry: "text-amber-400",
                  error: "text-rose-400",
                  queue_flush: "text-cyan-400",
                  network_change: "text-purple-400",
                };
                const color = typeColors[log.type] || "text-cyan-200";

                return (
                  <div
                    key={log.id}
                    className="mb-1 flex items-start gap-2 text-xs leading-tight"
                  >
                    <span className="text-cyan-400/60 shrink-0">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className={`${color} shrink-0 font-semibold`}>
                      {log.type}:
                    </span>
                    <span className="text-cyan-200/80 break-words">
                      {log.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Hint */}
        <div className="mt-2 text-[10px] text-cyan-500/50 text-center">
          Press Ctrl+Alt+Q to toggle
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import { useEffect, useRef, useState, useCallback } from "react";
import { db } from "@/store/db";
import type { SyncEvent } from "@/sync/syncSchema";
import { registerOnlineSync, isOnline } from "@/utils/network";
import { logTelemetry } from "@/utils/telemetryLogger";

interface SyncJob {
  id: string;
  sessionId: string;
  userId: string;
  binary: Uint8Array;
  diffSummary: string;
  createdAt: number;
  retryCount: number;
  lastRetryAt?: number;
}

const MAX_RETRIES = 5;
const DEBOUNCE_DELAY = 1000; // 1 second inactivity before autosave
const IDLE_TIMEOUT = 3000; // 3 seconds for idle callback

/**
 * Hook for managing autosave queue with idle commits and retry logic
 * @param sessionId - Current session ID
 * @param binary - Binary data to save (Uint8Array from Automerge)
 * @param userId - User ID (defaults to "local-user" if not provided)
 */
export function useAutosaveQueue(
  sessionId: string | null,
  binary?: Uint8Array,
  userId: string = "local-user"
) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [totalRetries, setTotalRetries] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const queue = useRef<SyncJob[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isProcessing = useRef(false);
  const lastBinaryRef = useRef<Uint8Array | null>(null);
  const forceSyncRef = useRef<(() => void) | null>(null);
  const syncNextJobRef = useRef<(() => void) | null>(null);

  // Sync function with retry logic
  const syncNextJob = useCallback(async () => {
    // Skip processing if document is hidden (performance optimization)
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }

    if (isProcessing.current || queue.current.length === 0 || !isOnline()) {
      return;
    }

    isProcessing.current = true;
    setIsSyncing(true);

    const job = queue.current[0];
    if (!job) {
      isProcessing.current = false;
      setIsSyncing(false);
      return;
    }

    // Performance tracking: start timestamp
    const startTime = performance.now();

    // Log commit start
    await logTelemetry(
      "commit_start",
      "Autosave commit started",
      { jobId: job.id },
      job.sessionId
    );

    try {
      // Create sync event with binary data
      // The change object contains the binary for the sync handler
      // Call the API route instead of syncLambdaHandler directly
      // This ensures server-side code (filesystem, etc.) only runs on the server
      // Convert Uint8Array to regular array for JSON serialization
      const binaryArray = Array.from(job.binary);

      const syncEvent: SyncEvent = {
        userId: job.userId,
        sessionId: job.sessionId,
        diffSummary: job.diffSummary,
        change: {
          binary: binaryArray, // Send as array, API route will convert back to Uint8Array
          data: binaryArray,
        },
        timestamp: job.createdAt,
      };

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(syncEvent),
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error || `Sync failed with status ${res.status}`
        );
      }

      const response = await res.json();

      if (response.status === "ok") {
        // Success: remove from queue
        queue.current.shift();
        setQueueSize(queue.current.length);
        setLastSyncTime(Date.now());
        setSuccessCount((prev) => prev + 1);
        setLastError(null);

        // Remove from Dexie snapshots (already synced)
        await db.snapshots.delete(job.id).catch(() => {
          // Ignore errors on cleanup
        });

        // Performance tracking: end timestamp and log diff
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Log commit success with performance metrics
        await logTelemetry(
          "commit_success",
          "Commit synced successfully",
          { jobId: job.id, duration },
          job.sessionId
        );

        console.log(`[AUTOSAVE] Sync successful: ${job.id} (${duration.toFixed(2)}ms)`);
      } else {
        // Error response but not a network error
        throw new Error(response.error || "Sync failed");
      }
    } catch (err: any) {
      console.warn("[AUTOSAVE] Sync error:", err);

      const errorMessage = err.message || String(err);
      setLastError(errorMessage);
      setErrorCount((prev) => prev + 1);

      // Log error
      await logTelemetry(
        "error",
        "Sync error occurred",
        { jobId: job.id, error: errorMessage, retryCount: job.retryCount },
        job.sessionId
      );

      job.retryCount += 1;
      job.lastRetryAt = Date.now();
      setTotalRetries((prev) => prev + 1);

      if (job.retryCount < MAX_RETRIES) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = 1000 * Math.pow(2, job.retryCount - 1);

        // Log retry
        await logTelemetry(
          "retry",
          "Retry triggered",
          { attempt: job.retryCount, jobId: job.id, delay },
          job.sessionId
        );

        console.log(
          `[AUTOSAVE] Retrying job ${job.id} in ${delay}ms (attempt ${job.retryCount}/${MAX_RETRIES})`
        );

        setTimeout(() => {
          if (isOnline()) {
            syncNextJob();
          }
        }, delay);
      } else {
        // Max retries reached, remove from queue but keep in Dexie
        console.error(
          `[AUTOSAVE] Job failed permanently after ${MAX_RETRIES} attempts:`,
          job.id
        );

        // Log final error (max retries reached)
        await logTelemetry(
          "error",
          "Job failed permanently after max retries",
          { jobId: job.id, retryCount: job.retryCount, error: errorMessage },
          job.sessionId
        );

        queue.current.shift();
        setQueueSize(queue.current.length);
        // Keep in Dexie for manual retry later
      }
    } finally {
      isProcessing.current = false;
      setIsSyncing(false);

      // Process next job if available
      if (queue.current.length > 0 && isOnline()) {
        setTimeout(() => syncNextJob(), 100);
      }
    }
  }, []);

  // Store syncNextJob in ref for use in queueJob
  syncNextJobRef.current = syncNextJob;

  // Debounced function to add job to queue
  const queueJob = useCallback(
    (newBinary: Uint8Array) => {
      if (!sessionId || !newBinary) return;

      // Clear existing debounce timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Check if binary actually changed (avoid duplicate commits)
      if (lastBinaryRef.current) {
        const changed =
          newBinary.length !== lastBinaryRef.current.length ||
          !newBinary.every((byte, i) => byte === lastBinaryRef.current![i]);
        if (!changed) {
          return; // Skip if no change
        }
      }

      lastBinaryRef.current = newBinary;

      // Debounce: wait 1s of inactivity before adding to queue
      debounceTimer.current = setTimeout(() => {
        const job: SyncJob = {
          id: `${sessionId}-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          sessionId,
          userId,
          binary: newBinary,
          diffSummary: `Autosave at ${new Date().toISOString()}`,
          createdAt: Date.now(),
          retryCount: 0,
        };

        queue.current.push(job);
        setQueueSize(queue.current.length);

        // Save to Dexie immediately for offline persistence
        db.snapshots
          .put({
            key: job.id,
            sessionId,
            version: Date.now(),
            binary: newBinary,
            updatedAt: Date.now(),
          })
          .catch((err) => {
            console.error("[AUTOSAVE] Failed to save to Dexie:", err);
          });

        // Trigger sync if online and not already processing
        if (isOnline() && !isProcessing.current && syncNextJobRef.current) {
          syncNextJobRef.current();
        }
      }, DEBOUNCE_DELAY);
    },
    [sessionId, userId]
  );

  // Add job when binary changes
  useEffect(() => {
    if (binary) {
      queueJob(binary);
    }
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [binary, queueJob]);

  // Idle callback trigger for sync - replaced setTimeout with requestIdleCallback
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Use requestIdleCallback if available, otherwise fallback to setTimeout
    const scheduleSync = () => {
      // Skip if document is hidden
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      if (queue.current.length > 0 && !isProcessing.current && isOnline()) {
        syncNextJob();
      }
    };

    let idleCallbackId: ReturnType<typeof setTimeout> | number | null = null;

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleCallbackId = (window as any).requestIdleCallback(scheduleSync, {
        timeout: IDLE_TIMEOUT,
      }) as number;
    } else if (typeof window !== "undefined") {
      // Fallback for browsers without requestIdleCallback
      idleCallbackId = setTimeout(scheduleSync, IDLE_TIMEOUT);
    }

    return () => {
      if (idleCallbackId !== null) {
        if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
          (window as any).cancelIdleCallback(idleCallbackId);
        } else {
          clearTimeout(idleCallbackId);
        }
      }
    };
  }, [syncNextJob]);

  // Flush idle method for manual QA trigger
  const flushIdle = useCallback(() => {
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => {
        if (queue.current.length > 0 && !isProcessing.current && isOnline()) {
          syncNextJob();
        }
      }, { timeout: 100 });
    } else {
      setTimeout(() => {
        if (queue.current.length > 0 && !isProcessing.current && isOnline()) {
          syncNextJob();
        }
      }, 100);
    }
  }, [syncNextJob]);

  // Online event handler - trigger sync when coming back online
  useEffect(() => {
    const cleanup = registerOnlineSync(async () => {
      console.log("[AUTOSAVE] Online event detected, triggering sync");

      // Log network change
      if (sessionId) {
        await logTelemetry(
          "network_change",
          "Network connection restored",
          { queueSize: queue.current.length },
          sessionId
        );
      }

      if (queue.current.length > 0 && !isProcessing.current) {
        syncNextJob();
      }
    });

    return cleanup;
  }, [syncNextJob, sessionId]);

  // Load pending jobs from Dexie on mount
  useEffect(() => {
    if (!sessionId) return;

    const loadPendingJobs = async () => {
      try {
        const pendingSnapshots = await db.snapshots
          .where("sessionId")
          .equals(sessionId)
          .sortBy("updatedAt");

        // Convert snapshots to jobs
        const pendingJobs: SyncJob[] = pendingSnapshots.map((snapshot) => ({
          id: snapshot.key,
          sessionId: snapshot.sessionId,
          userId,
          binary: snapshot.binary,
          diffSummary: `Recovered autosave from ${new Date(
            snapshot.updatedAt
          ).toISOString()}`,
          createdAt: snapshot.updatedAt,
          retryCount: 0,
        }));

        if (pendingJobs.length > 0) {
          queue.current = [...queue.current, ...pendingJobs];
          setQueueSize(queue.current.length);
          console.log(
            `[AUTOSAVE] Loaded ${pendingJobs.length} pending jobs from Dexie`
          );

          // Trigger sync if online
          if (isOnline() && !isProcessing.current) {
            syncNextJob();
          }
        }
      } catch (err) {
        console.error("[AUTOSAVE] Failed to load pending jobs:", err);
      }
    };

    loadPendingJobs();
  }, [sessionId, userId, syncNextJob]);

  // Force sync function exposed for manual trigger
  const forceSync = useCallback(() => {
    if (queue.current.length > 0 && !isProcessing.current && isOnline()) {
      syncNextJob();
    } else if (queue.current.length === 0 && lastBinaryRef.current) {
      // Force create a new job from last binary
      const job: SyncJob = {
        id: `${sessionId}-${Date.now()}-force-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        sessionId: sessionId!,
        userId,
        binary: lastBinaryRef.current,
        diffSummary: `Manual sync at ${new Date().toISOString()}`,
        createdAt: Date.now(),
        retryCount: 0,
      };
      queue.current.push(job);
      setQueueSize(queue.current.length);
      syncNextJob();
    }
  }, [sessionId, userId, syncNextJob]);

  forceSyncRef.current = forceSync;

  return {
    queue: queue.current,
    queueSize,
    isSyncing,
    lastSyncTime,
    lastError,
    totalRetries,
    successCount,
    errorCount,
    forceSync,
    flushIdle, // Expose for QA testing
  };
}

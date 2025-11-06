import { useCallback, useEffect, useState } from "react";

const CACHE_PREFIX = "explain-cache/";

/**
 * Get cache key for a node ID
 */
function getCacheKey(nodeId: string): string {
  return `${CACHE_PREFIX}${nodeId}`;
}

/**
 * Get cached summary for a node
 * @param nodeId - The node ID to get cache for
 * @returns Cached summary string or null if not found
 */
export function getExplainCache(nodeId: string): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    const cached = localStorage.getItem(getCacheKey(nodeId));
    if (!cached) return null;
    return JSON.parse(cached) as string;
  } catch (err) {
    console.warn(`[EXPLAIN_CACHE] Failed to get cache for ${nodeId}:`, err);
    return null;
  }
}

/**
 * Set cached summary for a node
 * @param nodeId - The node ID to cache for
 * @param summary - The summary string to cache
 */
export function setExplainCache(nodeId: string, summary: string): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(getCacheKey(nodeId), JSON.stringify(summary));
  } catch (err) {
    console.warn(`[EXPLAIN_CACHE] Failed to set cache for ${nodeId}:`, err);
  }
}

/**
 * Clear cached summary for a node
 * @param nodeId - The node ID to clear cache for
 */
export function clearExplainCache(nodeId: string): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(getCacheKey(nodeId));
  } catch (err) {
    console.warn(`[EXPLAIN_CACHE] Failed to clear cache for ${nodeId}:`, err);
  }
}

/**
 * Clear all explain cache entries
 */
export function clearAllExplainCache(): void {
  if (typeof window === "undefined") return;
  
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.warn("[EXPLAIN_CACHE] Failed to clear all cache:", err);
  }
}

/**
 * Hook for managing explain cache for a specific node
 * Follows React + Zustand safe-read pattern with localStorage persistence
 * @param nodeId - The node ID to cache explanations for (can be null)
 * @returns Object with cached summary, set, and clear functions
 */
export function useExplainCache(nodeId: string | null) {
  const [cachedSummary, setCachedSummary] = useState<string | null>(null);

  // Load cache when nodeId changes
  useEffect(() => {
    if (!nodeId) {
      setCachedSummary(null);
      return;
    }

    const cached = getExplainCache(nodeId);
    setCachedSummary(cached);
  }, [nodeId]);

  const setCache = useCallback(
    (summary: string) => {
      if (!nodeId) return;
      setExplainCache(nodeId, summary);
      setCachedSummary(summary);
    },
    [nodeId]
  );

  const clearCache = useCallback(() => {
    if (!nodeId) return;
    clearExplainCache(nodeId);
    setCachedSummary(null);
  }, [nodeId]);

  return {
    cachedSummary,
    setCache,
    clearCache,
  };
}


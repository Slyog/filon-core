import { useCallback, useMemo } from "react";

const CACHE_PREFIX = "explain-cache/";

/**
 * Get cache key for a node ID
 */
function getCacheKey(nodeId: string): string {
  return `${CACHE_PREFIX}${nodeId}`;
}

/**
 * Get cached summary for a node
 */
export function getExplainCache(nodeId: string): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    const cached = localStorage.getItem(getCacheKey(nodeId));
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.warn(`[EXPLAIN_CACHE] Failed to get cache for ${nodeId}:`, err);
    return null;
  }
}

/**
 * Set cached summary for a node
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
 * @param nodeId - The node ID to cache explanations for
 * @returns Object with cached summary, set, and clear functions
 */
export function useExplainCache(nodeId: string | null) {
  const cachedSummary = useMemo(() => {
    if (!nodeId) return null;
    return getExplainCache(nodeId);
  }, [nodeId]);

  const setCache = useCallback(
    (summary: string) => {
      if (!nodeId) return;
      setExplainCache(nodeId, summary);
    },
    [nodeId]
  );

  const clearCache = useCallback(() => {
    if (!nodeId) return;
    clearExplainCache(nodeId);
  }, [nodeId]);

  return {
    cachedSummary,
    setCache,
    clearCache,
  };
}


/**
 * Hook for getting confidence color class based on confidence value
 * @param conf - Confidence value (0-1)
 * @returns Tailwind color class string
 */
export function useExplainConfidenceColor(conf: number): string {
  if (conf >= 0.9) return "emerald-400";
  if (conf >= 0.75) return "yellow-400";
  return "orange-400";
}


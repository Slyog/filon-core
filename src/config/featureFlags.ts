export const FEATURE_FLAGS = {
  AI_SUMMARIZER: true,
  CONTEXT_STREAM: true,
  SESSION_FEEDBACK: false,
  PRIVATE_ROOMS: false,
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/**
 * Hook zum Prüfen, ob ein Feature aktiviert ist
 * @param flag - Der Feature-Flag-Key
 * @returns boolean - true wenn Feature aktiviert ist
 */
export function useFeature(flag: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[flag];
}

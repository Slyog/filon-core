import { useSettings } from "@/store/settings";

/**
 * Hook to access runtime flags reactively
 * Updates when user settings change
 */
export const useRuntimeFlags = () => {
  const animationSpeed = useSettings((s) => s.animationSpeed);
  const glowIntensity = useSettings((s) => s.glowIntensity);

  return {
    motionEnabled: animationSpeed > 0.05,
    glowEnabled: glowIntensity > 0.05,
    soundEnabled: false, // default off during dev
  };
};

import { useSettings } from "@/store/settings";

/**
 * Hook to get animation speed multiplier for framer-motion
 * Returns 0 when speed ≤ 0.05 to disable animations entirely
 */
export function useAnimationSpeed(): number {
  const animationSpeed = useSettings((s) => s.animationSpeed);

  // Disable framer-motion entirely when speed is very low
  if (animationSpeed <= 0.05) {
    return 0;
  }

  return animationSpeed;
}

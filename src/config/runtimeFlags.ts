/**
 * FILON Step 16.2 - Runtime Flags
 * Global motion and audio kill-switches for performance mode
 * Now derived from user settings
 */
import { useSettings } from "@/store/settings";

// Get initial state from store (for SSR compatibility)
let initialMotionEnabled = true;
let initialGlowEnabled = true;

if (typeof window !== "undefined") {
  try {
    const store = useSettings.getState();
    initialMotionEnabled = store.animationSpeed > 0.05;
    initialGlowEnabled = store.glowIntensity > 0.05;
  } catch {
    // Store might not be initialized yet
  }
}

/**
 * Get current runtime flags
 * Use this function to get reactive values in components
 */
export function getRuntimeFlags() {
  if (typeof window === "undefined") {
    return {
      motionEnabled: initialMotionEnabled,
      glowEnabled: initialGlowEnabled,
      soundEnabled: false,
    };
  }

  try {
    const store = useSettings.getState();
    return {
      motionEnabled: store.animationSpeed > 0.05,
      glowEnabled: store.glowIntensity > 0.05,
      soundEnabled: false, // default off during dev
    };
  } catch {
    return {
      motionEnabled: initialMotionEnabled,
      glowEnabled: initialGlowEnabled,
      soundEnabled: false,
    };
  }
}

/**
 * Legacy export for backward compatibility
 * Use getRuntimeFlags() in new code for reactive access
 */
export const runtimeFlags = {
  get motionEnabled() {
    return getRuntimeFlags().motionEnabled;
  },
  get glowEnabled() {
    return getRuntimeFlags().glowEnabled;
  },
  soundEnabled: false, // default off during dev
};

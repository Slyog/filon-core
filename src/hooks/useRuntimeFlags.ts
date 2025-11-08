import { runtimeFlags } from "@/config/runtimeFlags";

/**
 * Hook to access runtime flags
 * Future: Will support reactive updates when user settings are implemented
 */
export const useRuntimeFlags = () => runtimeFlags;


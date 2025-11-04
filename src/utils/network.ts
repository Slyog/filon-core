/**
 * Network utility functions for handling online/offline events
 */

/**
 * Registers an event listener for online events and returns cleanup function
 * @param trigger - Function to call when online event fires
 * @returns Cleanup function to remove event listener
 */
export function registerOnlineSync(trigger: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("online", trigger);
  return () => window.removeEventListener("online", trigger);
}

/**
 * Checks if the browser is currently online
 */
export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

/**
 * Registers callbacks for online and offline events
 */
export function registerNetworkStatus(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}

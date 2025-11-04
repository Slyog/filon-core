/**
 * Utility functions for registering global keyboard shortcuts
 */

/**
 * Registers a keyboard shortcut for toggling the sync dashboard (Ctrl+Alt+Q)
 * @param toggle - Function to call when shortcut is pressed
 * @returns Cleanup function to remove event listener
 */
export function registerDashboardToggle(toggle: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (e: KeyboardEvent) => {
    if (
      e.ctrlKey &&
      e.altKey &&
      e.key.toLowerCase() === "q" &&
      !e.shiftKey &&
      !e.metaKey
    ) {
      e.preventDefault();
      toggle();
    }
  };

  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}

/**
 * Registers a generic keyboard shortcut
 * @param keys - Object with modifier keys and the target key
 * @param callback - Function to call when shortcut is pressed
 * @returns Cleanup function to remove event listener
 */
export function registerShortcut(
  keys: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
    key: string;
  },
  callback: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (e: KeyboardEvent) => {
    if (
      (keys.ctrl === undefined || keys.ctrl === e.ctrlKey) &&
      (keys.alt === undefined || keys.alt === e.altKey) &&
      (keys.shift === undefined || keys.shift === e.shiftKey) &&
      (keys.meta === undefined || keys.meta === e.metaKey) &&
      e.key.toLowerCase() === keys.key.toLowerCase()
    ) {
      e.preventDefault();
      callback();
    }
  };

  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}

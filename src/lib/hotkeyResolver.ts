/**
 * Centralized hotkey resolver with debounce, collision detection, and modifier mapping
 */

type HotkeyHandler = (e: KeyboardEvent) => void;
type HotkeyDescriptor = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: HotkeyHandler;
  id: string;
};

const HOTKEY_DEBOUNCE_MS = 8; // 8ms tick for debounce
const registeredHotkeys = new Map<string, HotkeyDescriptor>();
const debounceTimers = new Map<string, NodeJS.Timeout>();
const collisionWarnings = new Set<string>();

/**
 * Safe modifier combo map
 */
const modifierMap = {
  ctrl: "Ctrl",
  meta: "Meta",
  shift: "Shift",
  alt: "Alt",
} as const;

/**
 * Generate hotkey ID from descriptor
 */
function getHotkeyId(descriptor: Omit<HotkeyDescriptor, "id" | "handler">): string {
  const parts = [];
  if (descriptor.ctrl) parts.push("Ctrl");
  if (descriptor.meta) parts.push("Meta");
  if (descriptor.shift) parts.push("Shift");
  if (descriptor.alt) parts.push("Alt");
  parts.push(descriptor.key.toLowerCase());
  return parts.join("+");
}

/**
 * Check if two hotkey descriptors collide
 */
function hotkeysCollide(a: HotkeyDescriptor, b: HotkeyDescriptor): boolean {
  return (
    a.key.toLowerCase() === b.key.toLowerCase() &&
    !!a.ctrl === !!b.ctrl &&
    !!a.meta === !!b.meta &&
    !!a.shift === !!b.shift &&
    !!a.alt === !!b.alt
  );
}

/**
 * Detect collisions and warn once per session
 */
function detectCollisions(newHotkey: HotkeyDescriptor): void {
  for (const [id, existing] of registeredHotkeys.entries()) {
    if (id !== newHotkey.id && hotkeysCollide(newHotkey, existing)) {
      const collisionKey = `${newHotkey.id}-${existing.id}`;
      if (!collisionWarnings.has(collisionKey)) {
        console.warn(
          `[HOTKEY] Collision detected: ${newHotkey.id} conflicts with ${existing.id}`
        );
        collisionWarnings.add(collisionKey);
      }
    }
  }
}

/**
 * Global keydown handler with debounce
 */
let globalHandler: ((e: KeyboardEvent) => void) | null = null;

function setupGlobalHandler(): void {
  if (typeof window === "undefined" || globalHandler) return;

  globalHandler = (e: KeyboardEvent) => {
    // Debounce handler calls to 8ms tick
    const handlerId = `global-${Date.now()}`;
    
    if (debounceTimers.has(handlerId)) {
      clearTimeout(debounceTimers.get(handlerId)!);
    }

    debounceTimers.set(
      handlerId,
      setTimeout(() => {
        for (const [id, hotkey] of registeredHotkeys.entries()) {
          const matches =
            hotkey.key.toLowerCase() === e.key.toLowerCase() &&
            (hotkey.ctrl === undefined || hotkey.ctrl === e.ctrlKey) &&
            (hotkey.meta === undefined || hotkey.meta === e.metaKey) &&
            (hotkey.shift === undefined || hotkey.shift === e.shiftKey) &&
            (hotkey.alt === undefined || hotkey.alt === e.altKey);

          if (matches) {
            e.preventDefault();
            hotkey.handler(e);
            break; // Only trigger first matching hotkey
          }
        }
        debounceTimers.delete(handlerId);
      }, HOTKEY_DEBOUNCE_MS)
    );
  };

  // Use KeyDown listener with passive:false to prevent scroll conflicts
  window.addEventListener("keydown", globalHandler, { passive: false });
}

/**
 * Register a hotkey
 */
export function registerHotkey(
  descriptor: Omit<HotkeyDescriptor, "id" | "handler">,
  handler: HotkeyHandler
): string {
  const id = getHotkeyId(descriptor);
  
  // Detect collisions
  const hotkey: HotkeyDescriptor = { ...descriptor, id, handler };
  detectCollisions(hotkey);

  registeredHotkeys.set(id, hotkey);
  setupGlobalHandler();

  return id;
}

/**
 * Unregister a hotkey
 */
export function unregisterHotkey(id: string): void {
  registeredHotkeys.delete(id);
  
  // Clean up debounce timer if exists
  if (debounceTimers.has(id)) {
    clearTimeout(debounceTimers.get(id)!);
    debounceTimers.delete(id);
  }

  // Remove global handler if no hotkeys left
  if (registeredHotkeys.size === 0 && globalHandler) {
    window.removeEventListener("keydown", globalHandler);
    globalHandler = null;
  }
}

/**
 * Get all registered hotkeys (for debugging)
 */
export function getRegisteredHotkeys(): HotkeyDescriptor[] {
  return Array.from(registeredHotkeys.values());
}

/**
 * Clear all hotkeys (for testing)
 */
export function clearAllHotkeys(): void {
  registeredHotkeys.clear();
  debounceTimers.forEach((timer) => clearTimeout(timer));
  debounceTimers.clear();
  collisionWarnings.clear();
  
  if (globalHandler) {
    window.removeEventListener("keydown", globalHandler);
    globalHandler = null;
  }
}


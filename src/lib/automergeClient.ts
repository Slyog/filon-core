"use client";

// Eagerly load Automerge in the browser to avoid Node.js WASM path issues
let AutomergeModule: typeof import("@automerge/automerge") | null = null;
let loadPromise: Promise<typeof import("@automerge/automerge")> | null = null;

// Pre-load Automerge when module is imported in browser
if (typeof window !== "undefined") {
  loadPromise = import("@automerge/automerge")
    .then((module) => {
      AutomergeModule = module;
      return module;
    })
    .catch((err) => {
      console.error("[Automerge] Failed to load:", err);
      throw err;
    });
}

async function loadAutomerge() {
  if (typeof window === "undefined") {
    throw new Error("Automerge can only be used in the browser");
  }

  if (AutomergeModule) {
    return AutomergeModule;
  }

  if (!loadPromise) {
    loadPromise = import("@automerge/automerge").then((module) => {
      AutomergeModule = module;
      return module;
    });
  }

  return loadPromise;
}

// Export a proxy that waits for Automerge to load
const AutomergeProxy = new Proxy({} as typeof import("@automerge/automerge"), {
  get(_target, prop) {
    if (typeof window === "undefined") {
      throw new Error("Automerge can only be used in the browser");
    }

    if (!AutomergeModule) {
      // If not loaded yet, throw an error with helpful message
      // In practice, components should wait for mount or use useEffect
      throw new Error(
        `Automerge is still loading. Ensure you're accessing Automerge after component mount or use the loadAutomerge() function.`
      );
    }

    const value = (AutomergeModule as any)[prop];
    if (typeof value === "function") {
      return value.bind(AutomergeModule);
    }
    return value;
  },
});

export default AutomergeProxy;
export { loadAutomerge };

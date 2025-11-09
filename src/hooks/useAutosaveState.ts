"use client";

import { create } from "zustand";

export type AutosaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "error"
  | "offline";

export type AutosaveEvent = {
  status: AutosaveStatus;
  at: number;
  meta?: Record<string, unknown>;
};

type AutosaveStore = {
  status: AutosaveStatus;
  setStatus: (status: AutosaveStatus, meta?: Record<string, unknown>) => void;
};

const AUTOSAVE_EVENT_NAME = "filon:autosave";

declare global {
  interface Window {
    __filonAutosaveEmitter?: EventTarget;
    __filonAutosaveTest?: {
      setStatus: (
        status: AutosaveStatus,
        meta?: Record<string, unknown>
      ) => void;
      getStatus: () => AutosaveStatus;
    };
  }

  // eslint-disable-next-line no-var
  var __filonAutosaveEmitter: EventTarget | undefined;
}

const getEmitter = () => {
  if (typeof window !== "undefined") {
    if (!window.__filonAutosaveEmitter) {
      window.__filonAutosaveEmitter = new EventTarget();
    }
    return window.__filonAutosaveEmitter;
  }

  if (!globalThis.__filonAutosaveEmitter) {
    globalThis.__filonAutosaveEmitter = new EventTarget();
  }
  return globalThis.__filonAutosaveEmitter;
};

type EmitOptions = {
  meta?: Record<string, unknown>;
};

export const emitAutosaveEvent = (
  status: AutosaveStatus,
  options: EmitOptions = {}
) => {
  const detail: AutosaveEvent = {
    status,
    at: Date.now(),
    meta: options.meta,
  };

  getEmitter().dispatchEvent(new CustomEvent(AUTOSAVE_EVENT_NAME, { detail }));
};

export const subscribeAutosaveEvents = (
  listener: (event: AutosaveEvent) => void
) => {
  const handler = (event: Event) => {
    const custom = event as CustomEvent<AutosaveEvent>;
    listener(custom.detail);
  };
  const emitter = getEmitter();
  emitter.addEventListener(AUTOSAVE_EVENT_NAME, handler);
  return () => emitter.removeEventListener(AUTOSAVE_EVENT_NAME, handler);
};

let savedResetTimer: ReturnType<typeof setTimeout> | null = null;
const SAVED_RESET_DELAY = 2000;

export const useAutosaveState = create<AutosaveStore>()((set, get) => {
  const internalSet = (
    status: AutosaveStatus,
    meta?: Record<string, unknown>
  ) => {
    set({ status });
    emitAutosaveEvent(status, { meta });
  };

  return {
    status: "idle",
    setStatus: (status, meta) => {
      const current = get().status;
      if (current === status) {
        emitAutosaveEvent(status, { meta });
      } else {
        internalSet(status, meta);
      }

      const holdSaved =
        meta && typeof (meta as { qaHold?: unknown }).qaHold === "boolean"
          ? (meta as { qaHold?: unknown }).qaHold === true
          : false;

      if (status === "saved") {
        if (savedResetTimer) {
          clearTimeout(savedResetTimer);
        }
        if (!holdSaved) {
          savedResetTimer = setTimeout(() => {
            if (get().status === "saved") {
              internalSet("idle", { source: "auto-dismiss" });
            }
          }, SAVED_RESET_DELAY);
        } else {
          savedResetTimer = null;
        }
      } else if (savedResetTimer) {
        clearTimeout(savedResetTimer);
        savedResetTimer = null;
      }
    },
  };
});

const exposeTestHooks = () => {
  if (typeof window === "undefined") {
    return;
  }
  const globalWindow = window as Window;
  if (!globalWindow.__filonAutosaveTest) {
    globalWindow.__filonAutosaveTest = {
      setStatus: (status, meta) => {
        useAutosaveState.getState().setStatus(status, meta);
      },
      getStatus: () => useAutosaveState.getState().status,
    };
  }
};

exposeTestHooks();



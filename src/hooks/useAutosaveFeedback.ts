"use client";

import { useEffect, useMemo } from "react";

import type { AutosaveEvent, AutosaveStatus } from "./useAutosaveState";
import {
  emitAutosaveEvent,
  subscribeAutosaveEvents,
} from "./useAutosaveState";

type AutosaveFeedbackHook = {
  emit: (status: AutosaveStatus, meta?: Record<string, unknown>) => void;
  subscribe: (listener: (event: AutosaveEvent) => void) => () => void;
};

export function useAutosaveFeedback(
  listener?: (event: AutosaveEvent) => void
): AutosaveFeedbackHook {
  useEffect(() => {
    if (!listener) return;
    const unsubscribe = subscribeAutosaveEvents(listener);
    return () => {
      unsubscribe();
    };
  }, [listener]);

  return useMemo(
    () => ({
      emit: (status: AutosaveStatus, meta?: Record<string, unknown>) =>
        emitAutosaveEvent(status, { meta }),
      subscribe: subscribeAutosaveEvents,
    }),
    []
  );
}


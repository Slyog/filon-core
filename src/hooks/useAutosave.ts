import { useCallback, useEffect, useRef } from "react";

import {
  useAutosaveState,
  type AutosaveStatus,
} from "./useAutosaveState";

const DEFAULT_DELAY = 1500;

export function useAutosave<T>(
  data: T | null,
  saveFn: (data: T) => Promise<void>,
  delay = DEFAULT_DELAY
) {
  const status = useAutosaveState((state) => state.status);
  const setStatus = useAutosaveState((state) => state.setStatus);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDataRef = useRef<T | null>(data);
  const latestSaveFnRef = useRef(saveFn);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);

  useEffect(() => {
    latestSaveFnRef.current = saveFn;
  }, [saveFn]);

  const resolveErrorStatus = useCallback((): AutosaveStatus => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return "offline";
    }
    return "error";
  }, []);

  const triggerSave = useCallback(() => {
    clearTimer();

    if (latestDataRef.current === null) {
      return;
    }

    setStatus("saving", { source: "autosave" });

    timerRef.current = setTimeout(async () => {
      try {
        await latestSaveFnRef.current(latestDataRef.current as T);
        setStatus("saved", { source: "autosave" });
      } catch (error) {
        const resolved = resolveErrorStatus();
        setStatus(resolved, {
          source: "autosave",
          error:
            error instanceof Error ? error.message : JSON.stringify(error),
        });
      } finally {
        timerRef.current = null;
      }
    }, delay);
  }, [clearTimer, delay, resolveErrorStatus, setStatus]);

  useEffect(() => {
    if (data === null) {
      return;
    }

    triggerSave();

    return () => {
      clearTimer();
    };
  }, [data, triggerSave, clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return { status, triggerSave };
}

export type { AutosaveStatus } from "./useAutosaveState";




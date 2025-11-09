import { useState, useEffect, useCallback, useRef } from "react";

export type AutosaveStatus = "idle" | "saving" | "success" | "error";

export function useAutosave<T>(
  data: T | null,
  saveFn: (data: T) => Promise<void>,
  delay = 1500
) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDataRef = useRef<T | null>(data);
  const latestSaveFnRef = useRef(saveFn);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearReset = useCallback(() => {
    if (resetRef.current) {
      clearTimeout(resetRef.current);
      resetRef.current = null;
    }
  }, []);

  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);

  useEffect(() => {
    latestSaveFnRef.current = saveFn;
  }, [saveFn]);

  const triggerSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (latestDataRef.current === null) {
      return;
    }

    clearReset();
    setStatus("saving");

    timerRef.current = setTimeout(async () => {
      try {
        await latestSaveFnRef.current(latestDataRef.current as T);
        setStatus("success");
        resetRef.current = setTimeout(() => {
          setStatus("idle");
          resetRef.current = null;
        }, 1000);
      } catch {
        setStatus("error");
      } finally {
        timerRef.current = null;
      }
    }, delay);
  }, [clearReset, delay]);

  useEffect(() => {
    if (data === null) {
      return;
    }

    triggerSave();

    return () => {
      clearTimer();
    };
  }, [data, triggerSave, clearTimer]);

  useEffect(
    () => () => {
      clearTimer();
      clearReset();
    },
    [clearReset, clearTimer]
  );

  return { status, triggerSave };
}



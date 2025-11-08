import { useCallback, useEffect, useRef } from "react";

type AnyFunction = (...args: any[]) => void;

export function useThrottledCallback<T extends AnyFunction>(
  callback: T,
  delay = 60
): T {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestArgsRef = useRef<Parameters<T>>();

  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...(args: Parameters<T>)) => {
    latestArgsRef.current = args;
    if (timeoutRef.current) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      if (latestArgsRef.current) {
        callbackRef.current(...latestArgsRef.current);
      }
    }, delay);
  }, [delay]) as T;
}


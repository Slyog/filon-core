import { useCallback, useMemo } from "react";

export function useSessionToast() {
  const success = useCallback((message: string) => {
    console.info("[toast:success]", message);
  }, []);

  const error = useCallback((message: string) => {
    console.warn("[toast:error]", message);
  }, []);

  const info = useCallback((message: string) => {
    console.log("[toast:info]", message);
  }, []);

  return useMemo(
    () => ({
      success,
      error,
      info,
    }),
    [success, error, info]
  );
}


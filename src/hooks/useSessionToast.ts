import { useCallback } from "react";

export function useSessionToast() {
  const success = useCallback((message: string) => {
    console.info("[toast:success]", message);
  }, []);

  const error = useCallback((message: string) => {
    console.error("[toast:error]", message);
  }, []);

  const info = useCallback((message: string) => {
    console.log("[toast:info]", message);
  }, []);

  return { success, error, info };
}


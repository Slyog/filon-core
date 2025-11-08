import { useCallback, useRef } from "react";

export function useAutosaveFeedback() {
  const pendingRef = useRef(false);

  const markPending = useCallback(() => {
    pendingRef.current = true;
  }, []);

  const markSaved = useCallback(() => {
    pendingRef.current = false;
  }, []);

  const isPending = useCallback(() => pendingRef.current, []);

  return { markPending, markSaved, isPending };
}


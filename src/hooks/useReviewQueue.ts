import { useState, useCallback } from "react";

export function useReviewQueue<T>() {
  const [pending, setPending] = useState<T | null>(null);
  const [committed, setCommitted] = useState<T | null>(null);

  const queue = useCallback((update: T) => setPending(update), []);
  const commit = useCallback(() => {
    if (pending) {
      setCommitted(pending);
      setPending(null);
    }
  }, [pending]);

  const reject = useCallback(() => setPending(null), []);

  return { pending, committed, queue, commit, reject };
}


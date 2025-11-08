import { useCallback, useState } from "react";

export function useAutosaveFeedback() {
  const [pending, setPending] = useState(false);
  const [errorValue, setErrorValue] = useState<string | null>(null);

  const markPending = useCallback(() => {
    setPending(true);
  }, []);

  const markSaved = useCallback(() => {
    setPending(false);
    setErrorValue(null);
  }, []);

  const markError = useCallback((message: string) => {
    setPending(false);
    setErrorValue(message);
  }, []);

  const isPending = useCallback(() => pending, [pending]);
  const error = useCallback(() => errorValue, [errorValue]);

  return { markPending, markSaved, markError, isPending, error };
}

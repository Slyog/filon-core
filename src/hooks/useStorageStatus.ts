import { useEffect, useState } from "react";

export function useStorageStatus() {
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [quota, setQuota] = useState<{ used: number; quota: number } | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const isPersisted = await navigator.storage.persisted();
      const estimate = await navigator.storage.estimate();
      setPersisted(isPersisted);
      if (estimate.quota && estimate.usage) {
        setQuota({ used: estimate.usage, quota: estimate.quota });
      }
    })();
  }, []);

  const requestPersist = async () => {
    const result = await navigator.storage.persist();
    setPersisted(result);
    // Refresh quota after persistence request
    const estimate = await navigator.storage.estimate();
    if (estimate.quota && estimate.usage) {
      setQuota({ used: estimate.usage, quota: estimate.quota });
    }
    return result;
  };

  return { persisted, quota, requestPersist };
}

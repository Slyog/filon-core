"use client";

import { useState, useEffect } from "react";

export function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateStatus = () => {
      const isOffline =
        typeof navigator !== "undefined" ? !navigator.onLine : false;
      setOffline(isOffline);
    };

    updateStatus();

    window.addEventListener("offline", updateStatus);
    window.addEventListener("online", updateStatus);

    return () => {
      window.removeEventListener("offline", updateStatus);
      window.removeEventListener("online", updateStatus);
    };
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <div
      data-testid="offline-indicator"
      className="fixed right-4 top-2 rounded-xl bg-red-500/20 px-3 py-1 text-xs text-red-300 backdrop-blur-md"
    >
      Offline-Modus aktiviert
    </div>
  );
}


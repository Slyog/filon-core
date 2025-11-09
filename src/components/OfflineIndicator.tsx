"use client";

import { useState, useEffect } from "react";

export function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const setTrue = () => setOffline(true);
    const setFalse = () => setOffline(false);

    window.addEventListener("offline", setTrue);
    window.addEventListener("online", setFalse);

    return () => {
      window.removeEventListener("offline", setTrue);
      window.removeEventListener("online", setFalse);
    };
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <div className="fixed right-4 top-2 rounded-xl bg-red-500/20 px-3 py-1 text-xs text-red-300 backdrop-blur-md">
      Offline-Modus aktiviert
    </div>
  );
}


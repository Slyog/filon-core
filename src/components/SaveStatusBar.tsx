"use client";
import { useState, useEffect } from "react";

export default function SaveStatusBar() {
  const [status, setStatus] = useState("Idle");
  useEffect(() => {
    const onOnline = () => setStatus("🟢 Online");
    const onOffline = () => setStatus("🔴 Offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    onOnline();
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);
  return (
    <div className="fixed bottom-1 left-2 text-xs text-[var(--foreground)] opacity-60">
      {status}
    </div>
  );
}

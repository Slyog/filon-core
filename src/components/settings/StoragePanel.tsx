"use client";

import { useState } from "react";
import { useStorageStatus } from "@/hooks/useStorageStatus";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export default function StoragePanel() {
  const { persisted, quota, requestPersist } = useStorageStatus();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPersist = async () => {
    setIsRequesting(true);
    try {
      await requestPersist();
    } finally {
      setIsRequesting(false);
    }
  };

  const usagePercent =
    quota && quota.quota > 0 ? Math.round((quota.used / quota.quota) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-lg font-semibold text-zinc-200">
        Speicherverwaltung
      </h2>

      {/* Persistenzstatus */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-400">Persistenzstatus:</span>
        <span
          className={`text-sm font-medium ${
            persisted === true
              ? "text-emerald-400"
              : persisted === false
              ? "text-amber-400"
              : "text-zinc-500"
          }`}
        >
          {persisted === true
            ? "✓ Gesichert"
            : persisted === false
            ? "⚠ Nicht gesichert"
            : "Laden..."}
        </span>
      </div>

      {/* Quota-Anzeige */}
      {quota && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Speicherverbrauch:</span>
            <span className="text-zinc-300">
              {formatBytes(quota.used)} / {formatBytes(quota.quota)} (
              {usagePercent}%)
            </span>
          </div>
          {/* Progress Bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Persistenz-Button */}
      {persisted === false && (
        <button
          onClick={handleRequestPersist}
          disabled={isRequesting}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRequesting ? "Wird angefordert..." : "Speicher sichern"}
        </button>
      )}

      {persisted === true && (
        <p className="text-xs text-zinc-500">
          Ihr Speicher ist gesichert und wird nicht automatisch gelöscht.
        </p>
      )}
    </div>
  );
}

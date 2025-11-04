"use client";

import { useMemo, useState } from "react";
import { useQAStore } from "@/store/QAStore";
import type { QAStatus } from "@/store/QAStore";

interface QAPanelProps {
  className?: string;
}

export default function QAPanel({ className = "" }: QAPanelProps) {
  const entries = useQAStore((s) => s.entries);
  const clear = useQAStore((s) => s.clear);
  const [statusFilter, setStatusFilter] = useState<QAStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Status filter
      if (statusFilter !== "all" && entry.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesStep = entry.step?.toLowerCase().includes(query);
        const matchesNotes = entry.notes?.toLowerCase().includes(query);
        if (!matchesStep && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [entries, statusFilter, searchQuery]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getStatusBadgeClass = (status: QAStatus) => {
    switch (status) {
      case "success":
        return "bg-green-600/20 text-green-400 border-green-500/30";
      case "error":
        return "bg-red-600/20 text-red-400 border-red-500/30";
      case "info":
        return "bg-blue-600/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-zinc-600/20 text-zinc-400 border-zinc-500/30";
    }
  };

  const handleClear = () => {
    if (confirm("Clear all QA entries? This cannot be undone.")) {
      clear();
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-layer border border-zinc-800 rounded-lg ${className}`}
      style={{ zIndex: 100 }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-200">QA History</h2>
        <button
          onClick={handleClear}
          className="text-xs px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors"
          aria-label="Clear all QA entries"
        >
          Clear
        </button>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-zinc-800 space-y-2">
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as QAStatus | "all")}
          className="w-full px-2 py-1 bg-zinc-800 text-zinc-200 text-sm rounded border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
          <option value="info">Info</option>
        </select>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by step or notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-2 py-1 bg-zinc-800 text-zinc-200 text-sm rounded border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-zinc-500"
        />
      </div>

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto max-h-[60vh]">
        {filteredEntries.length === 0 ? (
          <div className="px-4 py-8 text-center text-zinc-500 text-sm">
            {entries.length === 0
              ? "No QA entries yet"
              : "No entries match the filters"}
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="px-4 py-3 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded border ${getStatusBadgeClass(
                          entry.status
                        )}`}
                      >
                        {entry.status}
                      </span>
                      {entry.step && (
                        <span className="text-xs text-zinc-400 font-mono">
                          {entry.step}
                        </span>
                      )}
                      <span className="text-xs text-zinc-600">
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-zinc-300 truncate">
                        {entry.notes}
                      </p>
                    )}
                    {entry.meta && Object.keys(entry.meta).length > 0 && (
                      <details className="mt-1">
                        <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400">
                          Metadata
                        </summary>
                        <pre className="text-xs text-zinc-600 mt-1 overflow-x-auto">
                          {JSON.stringify(entry.meta, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="px-4 py-2 border-t border-zinc-800 text-xs text-zinc-500 text-center">
        {filteredEntries.length} of {entries.length} entries
      </div>
    </div>
  );
}

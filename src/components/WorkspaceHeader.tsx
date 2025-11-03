"use client";
import { useSessionStore } from "@/store/SessionStore";
import { useState, useEffect } from "react";

export default function WorkspaceHeader() {
  const { sessions, activeSessionId, updateSessionTitle } = useSessionStore();
  const [editing, setEditing] = useState(false);
  const session = sessions.find((s) => s.id === activeSessionId);
  const [tempTitle, setTempTitle] = useState(session?.title || "");

  // Update tempTitle when session changes
  useEffect(() => {
    if (session) {
      setTempTitle(session.title);
    }
  }, [session?.title, session?.id]);

  if (!session) return null;

  const handleSave = () => {
    if (tempTitle.trim()) {
      updateSessionTitle(session.id, tempTitle.trim());
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setTempTitle(session.title);
    setEditing(false);
  };

  return (
    <div className="w-full border-b border-zinc-800 bg-zinc-900/70 px-4 py-2 flex justify-between items-center text-zinc-200 backdrop-blur">
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <input
              className="bg-zinc-800 px-2 py-1 rounded text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave();
                } else if (e.key === "Escape") {
                  handleCancel();
                }
              }}
              autoFocus
            />
            <button
              onClick={handleSave}
              className="text-cyan-400 hover:text-cyan-300 text-sm px-2"
            >
              ✓
            </button>
            <button
              onClick={handleCancel}
              className="text-zinc-500 hover:text-zinc-400 text-sm px-2"
            >
              ✕
            </button>
          </>
        ) : (
          <>
            <span className="text-sm font-medium text-zinc-400">
              Workspace:
            </span>
            <span
              className="font-semibold cursor-pointer hover:text-cyan-300 transition-colors"
              onClick={() => setEditing(true)}
            >
              {session.title}
            </span>
            <button
              onClick={() => setEditing(true)}
              className="text-zinc-500 hover:text-cyan-400 text-xs ml-1"
              title="Edit workspace name"
            >
              ✎
            </button>
          </>
        )}
      </div>

      <span className="text-xs text-zinc-500">
        {session.updatedAt
          ? `Last updated ${new Date(session.updatedAt).toLocaleTimeString()}`
          : "Unsaved"}
      </span>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Folder, PlusCircle, Trash2 } from "lucide-react";
import { useSessionStore } from "@/store/SessionStore";

export default function WorkspaceList() {
  const {
    sessions,
    activeSessionId,
    hydrateSessions,
    addSession,
    deleteSession,
    setActiveSession,
  } = useSessionStore();
  const router = useRouter();

  useEffect(() => {
    void hydrateSessions();
  }, [hydrateSessions]);

  const handleSelect = (id: string) => {
    setActiveSession(id);
    router.push(`/f/${id}`);
  };

  const handleNew = async () => {
    const name = window.prompt("New workspace name:");
    if (!name || !name.trim()) return;
    const id = await addSession(name.trim());
    router.push(`/f/${id}`);
  };

  if (!sessions || sessions.length === 0) {
    return (
      <div className="px-4 py-3 bg-zinc-900/60 border-b border-zinc-800 space-y-2 text-sm text-zinc-500">
        <div className="flex items-center justify-between">
          <span>No workspaces yet</span>
          <button
            onClick={handleNew}
            className="ml-2 inline-flex items-center gap-1 text-cyan-400 hover:underline"
          >
            <PlusCircle size={16} />
            <span>Create one</span>
          </button>
        </div>
        <div className="text-xs italic">
          No workspaces yet — a new one will be created when you add your first
          thought.
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/60">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold text-zinc-300 text-sm flex items-center gap-1">
          <Folder size={16} /> Workspaces
        </h2>
        <button
          onClick={handleNew}
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
          aria-label="Create workspace"
        >
          <PlusCircle size={16} />
        </button>
      </div>

      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => handleSelect(session.id)}
            className={`flex items-center justify-between text-sm px-2 py-1 rounded cursor-pointer transition-colors ${
              session.id === activeSessionId
                ? "bg-cyan-800/40 text-cyan-200"
                : "hover:bg-zinc-800/70 text-zinc-300"
            }`}
          >
            <span className="truncate">{session.title}</span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                deleteSession(session.id);
              }}
              className="text-zinc-400 hover:text-red-400 transition-colors"
              aria-label={`Delete ${session.title}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

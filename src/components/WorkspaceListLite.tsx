"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Folder, Plus, Trash2, Archive } from "lucide-react";
import { useSessionStore } from "@/store/SessionStore";
import { t } from "@/config/strings";

type WorkspaceListLiteProps = {
  collapsed?: boolean;
};

export default function WorkspaceListLite({
  collapsed = false,
}: WorkspaceListLiteProps) {
  const router = useRouter();
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const addSession = useSessionStore((s) => s.addSession);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const updateSessionTitle = useSessionStore((s) => s.updateSessionTitle);
  const deleteSession = useSessionStore((s) => s.deleteSession);

  const sorted = useMemo(
    () =>
      [...sessions].sort((a, b) => {
        const left = a.updatedAt ?? a.createdAt;
        const right = b.updatedAt ?? b.createdAt;
        return right - left;
      }),
    [sessions]
  );

  const handleCreate = async () => {
    const id = await addSession(t.newWorkspace);
    setActiveSession(id);
    router.push(`/f/${id}`);
  };

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-3 py-3">
        <button
          type="button"
          onClick={handleCreate}
          title={t.createNewWorkspace}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-cyan-300 hover:bg-zinc-800"
        >
          <Plus size={18} />
        </button>
        {sorted.slice(0, 6).map((workspace) => (
          <button
            key={workspace.id}
            type="button"
            onClick={() => {
              setActiveSession(workspace.id);
              router.push(`/f/${workspace.id}`);
            }}
            title={workspace.title}
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              workspace.id === activeSessionId
                ? "bg-cyan-500/20 text-cyan-300"
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            <Folder size={18} />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCreate}
        className="flex w-full items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
      >
        <Plus size={16} />
        {t.newWorkspace}
      </button>
      <div className="space-y-1">
        {sorted.length === 0 && (
          <p className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-zinc-500">
            {t.noWorkspacesYet}
          </p>
        )}
        {sorted.map((workspace) => (
          <div
            key={workspace.id}
            className={`group flex items-center justify-between rounded-lg px-2 py-1 ${
              workspace.id === activeSessionId
                ? "bg-cyan-500/10 text-cyan-200"
                : "hover:bg-zinc-900"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setActiveSession(workspace.id);
                router.push(`/f/${workspace.id}`);
              }}
              className="flex flex-1 items-center gap-2 overflow-hidden px-1 py-1 text-left text-sm"
            >
              <Folder size={14} className="shrink-0" />
              <span className="truncate">{workspace.title}</span>
            </button>
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => {
                  const value = window.prompt(
                    t.newName,
                    workspace.title
                  );
                  if (value && value.trim()) {
                    updateSessionTitle(workspace.id, value.trim());
                  }
                }}
                className="rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={() =>
                  window.alert(t.archivePlaceholder)
                }
                className="rounded bg-zinc-900 p-1 text-zinc-400 hover:bg-zinc-800"
                title={t.archivePlaceholder}
              >
                <Archive size={14} />
              </button>
              <button
                type="button"
                onClick={async () => {
                  const confirmed = window.confirm(
                    t.deleteWorkspace
                  );
                  if (!confirmed) return;
                  const wasActive = workspace.id === activeSessionId;
                  await deleteSession(workspace.id);
                  if (wasActive) {
                    router.replace("/");
                  }
                }}
                className="rounded bg-red-600 p-1 text-black hover:bg-red-500"
                title={t.delete}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

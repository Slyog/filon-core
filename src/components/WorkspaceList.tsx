"use client";
import { useRouter, usePathname } from "next/navigation";
import { useSessionStore } from "@/store/SessionStore";
import { useEffect } from "react";

export default function WorkspaceList() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    sessions,
    activeSessionId,
    setActiveSession,
    createOrGetActive,
    removeSession,
  } = useSessionStore();

  useEffect(() => {
    // Wenn Route auf /f/:id → aktiviere entsprechende Session
    if (pathname?.startsWith("/f/")) {
      const id = pathname.split("/f/")[1];
      if (id && id !== activeSessionId) {
        setActiveSession(id);
      }
    }
  }, [pathname, activeSessionId, setActiveSession]);

  const handleSwitch = (id: string) => {
    setActiveSession(id);
    router.push(`/f/${id}`);
  };

  const handleNew = async () => {
    const id = await createOrGetActive("New Workspace");
    router.push(`/f/${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this workspace?")) {
      removeSession(id);
      // Wenn gelöschte Session aktiv war, wechsle zu erster verbleibender oder Home
      const remaining = sessions.filter((s) => s.id !== id);
      if (id === activeSessionId) {
        if (remaining.length > 0) {
          handleSwitch(remaining[0].id);
        } else {
          router.push("/");
        }
      }
    }
  };

  return (
    <div className="w-full border-b border-zinc-700 bg-zinc-900/80 p-2 flex items-center justify-between backdrop-blur">
      <div className="flex gap-2 overflow-x-auto">
        {sessions.length === 0 && (
          <span className="text-zinc-500 text-sm px-2">No workspaces yet</span>
        )}
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSwitch(s.id)}
            className={
              "px-3 py-1 rounded-md text-sm transition-all " +
              (s.id === activeSessionId
                ? "bg-cyan-600 text-black font-medium"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700")
            }
          >
            {s.title || "Untitled"}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleNew}
          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-200 text-sm px-2 py-1 rounded transition-colors"
        >
          <span>+</span> New
        </button>
        {activeSessionId && (
          <button
            onClick={() => handleDelete(activeSessionId)}
            className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded transition-colors"
          >
            <span>🗑️</span> Delete
          </button>
        )}
      </div>
    </div>
  );
}

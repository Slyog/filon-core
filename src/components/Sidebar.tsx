"use client";
import { useSessionStore } from "@/store/SessionStore";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const {
    sessions,
    addSession,
    removeSession,
    activeSessionId,
    setActiveSession,
  } = useSessionStore();
  const router = useRouter();

  const handleNew = () => {
    const id = addSession();
    router.push(`/graph/${id}`);
  };

  const handleOpen = (id: string) => {
    setActiveSession(id);
    router.push(`/graph/${id}`);
  };

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-[rgba(10,15,18,0.9)] border-r border-[var(--border-glow)] text-[var(--foreground)] flex flex-col p-4 space-y-4 z-40">
      <h2 className="text-[var(--accent)] font-semibold mb-2">Workspaces</h2>

      <button
        onClick={handleNew}
        className="w-full px-4 py-2 bg-[var(--accent)] text-black rounded-lg hover:opacity-90 transition"
      >
        ➕ New Graph
      </button>

      <div className="flex-1 overflow-y-auto space-y-2">
        {sessions.length === 0 ? (
          <p className="opacity-60 text-sm mt-2">No graphs yet.</p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className={`cursor-pointer px-3 py-2 rounded-lg border border-transparent hover:border-[var(--accent)] ${
                s.id === activeSessionId ? "bg-[rgba(47,243,255,0.1)]" : ""
              }`}
              onClick={() => handleOpen(s.id)}
            >
              <div className="flex justify-between items-center">
                <span>{s.title}</span>
                <button
                  className="text-sm opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSession(s.id);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

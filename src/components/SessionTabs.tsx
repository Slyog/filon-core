"use client";
import { useSessionStore } from "@/store/SessionStore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function SessionTabs() {
  const { sessions, activeSessionId, setActiveSession } = useSessionStore();
  const router = useRouter();

  const closeSessionHandler = (id: string) => {
    const store = useSessionStore.getState();
    store.closeSession(id);

    // If closing active session, switch to another or redirect
    if (id === activeSessionId) {
      const remaining = store.sessions.filter((s) => s.id !== id);
      if (remaining.length > 0) {
        const nextSession = remaining[0];
        store.setActiveSession(nextSession.id);
        localStorage.setItem("lastSessionAt", Date.now().toString());
        router.push(`/f/${nextSession.id}`);
      } else {
        store.setActiveSession(null);
        router.push("/");
      }
    }
  };

  if (!sessions.length) return null;

  return (
    <div className="w-full flex gap-2 px-4 py-2 bg-[rgba(10,15,18,0.75)] backdrop-blur-md border-b border-[var(--border-glow)] shadow-[var(--shadow-soft)] overflow-x-auto">
      <AnimatePresence>
        {sessions.map((s) => {
          const isActive = s.id === activeSessionId;
          const hasUnsavedChanges = false; // TODO: Track unsaved state
          const status = isActive
            ? hasUnsavedChanges
              ? "saving"
              : "saved"
            : "idle";

          return (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer select-none ${
                isActive
                  ? "bg-[var(--accent)] text-black"
                  : "bg-[rgba(255,255,255,0.08)] text-white hover:bg-[rgba(255,255,255,0.15)]"
              }`}
              onClick={() => {
                setActiveSession(s.id);
                localStorage.setItem("lastSessionAt", Date.now().toString());
                router.push(`/f/${s.id}`);
              }}
            >
              <span className="text-sm font-medium truncate max-w-[120px]">
                {s.title || "Untitled"}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  status === "saving"
                    ? "bg-blue-400 animate-pulse"
                    : "bg-green-400"
                }`}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeSessionHandler(s.id);
                }}
                className="text-xs opacity-60 hover:opacity-100 ml-1"
              >
                ✕
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

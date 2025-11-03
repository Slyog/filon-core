import { create } from "zustand";
import { persist } from "zustand/middleware";

type Session = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  meta?: {
    nodeCount: number;
    edgeCount: number;
    lastSaved: number;
  };
};

type SessionState = {
  sessions: Session[];
  activeSessionId: string | null;
  addSession: (title?: string) => string;
  removeSession: (id: string) => void;
  setActiveSession: (id: string) => void;
  getLastActive: () => string | null;
  updateMetadata: (id: string, meta: Session["meta"]) => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      addSession: (title = "New Graph") => {
        const id = crypto.randomUUID();
        const newSession: Session = {
          id,
          title,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set({ sessions: [...get().sessions, newSession], activeSessionId: id });
        return id;
      },
      removeSession: (id) =>
        set({ sessions: get().sessions.filter((s) => s.id !== id) }),
      setActiveSession: (id) => set({ activeSessionId: id }),
      getLastActive: () => get().activeSessionId,
      updateMetadata: (id, meta) => {
        set({
          sessions: get().sessions.map((s) =>
            s.id === id ? { ...s, meta, updatedAt: Date.now() } : s
          ),
        });
      },
    }),
    { name: "filon-session-store" }
  )
);

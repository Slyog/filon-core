import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Session = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  category?:
    | "Idea"
    | "Knowledge"
    | "Guide"
    | "Inspiration"
    | "Project"
    | "Other";
  meta?: {
    nodeCount: number;
    edgeCount: number;
    lastSaved: number;
  };
};

export type PendingThought = {
  id: string;
  sessionId: string;
  content: string;
  thoughtType: string;
  createdAt: number;
};

type SessionState = {
  sessions: Session[];
  activeSessionId: string | null;
  pendingThoughts: PendingThought[];
  addSession: (title?: string, category?: Session["category"]) => string;
  createOrGetActive: (name?: string) => Promise<string>;
  removeSession: (id: string) => void;
  closeSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  getLastActive: () => string | null;
  updateMetadata: (id: string, meta: Session["meta"]) => void;
  updateCategory: (id: string, category: Session["category"]) => void;
  updateSessionTitle: (id: string, title: string) => void;
  generateTitleFromThought: (text: string) => string;
  openSession: (session: Session) => void;
  enqueueThought: (
    t: Omit<PendingThought, "id" | "createdAt">
  ) => PendingThought["id"];
  drainThoughtsForSession: (sessionId: string) => PendingThought[];
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      pendingThoughts: [],
      addSession: (
        title = "New Graph",
        category: Session["category"] = "Other"
      ) => {
        const id = crypto.randomUUID();
        const newSession: Session = {
          id,
          title,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          category,
        };
        set({ sessions: [...get().sessions, newSession], activeSessionId: id });
        return id;
      },
      createOrGetActive: async (name?: string) => {
        const state = get();
        if (state.activeSessionId) return state.activeSessionId;

        const newSession = {
          id: crypto.randomUUID(),
          title:
            name || `Untitled Workspace #${Math.floor(Math.random() * 1000)}`,
          category: "Other" as Session["category"],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set({
          sessions: [...state.sessions, newSession],
          activeSessionId: newSession.id,
        });

        // 🔹 wait a tiny bit to let Zustand persist
        await new Promise((res) => setTimeout(res, 100));
        return newSession.id;
      },
      updateSessionTitle: (id, title) => {
        const { sessions } = get();
        set({
          sessions: sessions.map((s) =>
            s.id === id ? { ...s, title, updatedAt: Date.now() } : s
          ),
        });
      },
      generateTitleFromThought: (text) => {
        const base = text.split(" ").slice(0, 3).join(" ");
        const id = Math.floor(Math.random() * 1000);
        return base ? `${base} #${id}` : `Untitled Workspace #${id}`;
      },
      removeSession: (id) => {
        const { sessions, activeSessionId } = get();
        const updated = sessions.filter((s) => s.id !== id);
        set({
          sessions: updated,
          activeSessionId:
            id === activeSessionId && updated.length > 0
              ? updated[0].id
              : id === activeSessionId
              ? null
              : activeSessionId,
        });
      },
      closeSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
          activeSessionId:
            state.activeSessionId === id ? null : state.activeSessionId,
        })),
      openSession: (session) =>
        set((state) => ({
          sessions: [...state.sessions, session],
          activeSessionId: session.id,
        })),
      setActiveSession: (id) => set({ activeSessionId: id }),
      getLastActive: () => get().activeSessionId,
      updateMetadata: (id, meta) => {
        set({
          sessions: get().sessions.map((s) =>
            s.id === id ? { ...s, meta, updatedAt: Date.now() } : s
          ),
        });
      },
      updateCategory: (id, category) => {
        set({
          sessions: get().sessions.map((s) =>
            s.id === id ? { ...s, category, updatedAt: Date.now() } : s
          ),
        });
      },
      enqueueThought: ({ sessionId, content, thoughtType }) => {
        const item: PendingThought = {
          id: crypto.randomUUID(),
          sessionId,
          content,
          thoughtType,
          createdAt: Date.now(),
        };
        set({ pendingThoughts: [...get().pendingThoughts, item] });
        return item.id;
      },
      drainThoughtsForSession: (sessionId) => {
        const all = get().pendingThoughts;
        const mine = all.filter((t) => t.sessionId === sessionId);
        if (mine.length === 0) {
          return [];
        }
        const rest = all.filter((t) => t.sessionId !== sessionId);
        set({ pendingThoughts: rest });
        return mine;
      },
    }),
    { name: "filon-session-store" }
  )
);

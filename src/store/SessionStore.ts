import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import localforage from "localforage";
import { SyncStatus } from "@/sync/syncSchema";

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
    lastSyncedAt?: number;
    pendingOps?: number;
    syncStatus?: SyncStatus;
  };
};

export type PendingThought = {
  id: string;
  sessionId: string;
  content: string;
  thoughtType: string;
  createdAt: number;
};

type PersistedSessionState = {
  sessions: Session[];
  activeSessionId: string | null;
  pendingThoughts: PendingThought[];
};

const STORAGE_KEY = "filon-sessions";
let latestPersistPayload: Record<string, unknown> | undefined;

export const setSessionBackupPayload = (
  payload?: Record<string, unknown>
): void => {
  latestPersistPayload = payload;
};

const storage: PersistStorage<PersistedSessionState> = {
  getItem: async (name) => {
    const stored = await localforage.getItem<{
      state: PersistedSessionState;
      version?: number;
      payload?: Record<string, unknown>;
    }>(name);

    if (!stored) {
      return null;
    }

    latestPersistPayload = stored.payload ?? latestPersistPayload;
    return {
      state: stored.state,
      version: stored.version,
    };
  },
  setItem: async (name, value) => {
    await localforage.setItem(name, {
      ...value,
      payload: latestPersistPayload,
    });
  },
  removeItem: (name) => localforage.removeItem(name),
};

type SessionState = {
  sessions: Session[];
  activeSessionId: string | null;
  pendingThoughts: PendingThought[];
  graphLoadedOnce: boolean;
  hydrateSessions: () => Promise<void>;
  addSession: (
    title?: string,
    category?: Session["category"]
  ) => Promise<string>;
  createOrGetActive: (name?: string) => Promise<string>;
  removeSession: (id: string) => void;
  deleteSession: (id: string) => Promise<void>;
  closeSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  getLastActive: () => string | null;
  updateMetadata: (id: string, meta: Session["meta"]) => void;
  updateCategory: (id: string, category: Session["category"]) => void;
  openSession: (session: Session) => void;
  updateSessionTitle: (id: string, title: string) => void;
  generateTitleFromThought: (content: string) => string;
  enqueueThought: (
    t: Omit<PendingThought, "id" | "createdAt">
  ) => PendingThought["id"];
  drainThoughtsForSession: (sessionId: string) => Promise<PendingThought[]>;
  setGraphLoadedOnce: (loaded: boolean) => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => {
      const persistSnapshot = async () => {
        const snapshot: PersistedSessionState = {
          sessions: get().sessions,
          activeSessionId: get().activeSessionId,
          pendingThoughts: get().pendingThoughts,
        };

        try {
          await localforage.setItem(STORAGE_KEY, {
            state: snapshot,
            version: 0,
            payload: latestPersistPayload,
          });
        } catch (error) {
          console.error("Failed to persist sessions", error);
        }
      };

      return {
        sessions: [],
        activeSessionId: null,
        pendingThoughts: [],
        graphLoadedOnce: false,
        hydrateSessions: async () => {
          try {
            const stored = await localforage.getItem<{
              state: PersistedSessionState;
              version?: number;
              payload?: Record<string, unknown>;
            }>(STORAGE_KEY);
            if (!stored) return;
            latestPersistPayload =
              stored.payload ?? latestPersistPayload ?? undefined;

            const snapshot = stored.state;
            if (!snapshot) return;

            set((prev) => {
              const nextSessions = snapshot.sessions ?? prev.sessions;
              const nextActive =
                snapshot.activeSessionId ??
                prev.activeSessionId ??
                (nextSessions.length > 0 ? nextSessions[0].id : null);

              return {
                ...prev,
                sessions: nextSessions,
                activeSessionId: nextActive,
                pendingThoughts:
                  snapshot.pendingThoughts ?? prev.pendingThoughts,
              };
            });
          } catch (error) {
            console.error("Failed to hydrate sessions", error);
          }
        },
        addSession: async (
          title = "New Graph",
          category: Session["category"] = "Other"
        ) => {
          const id = crypto.randomUUID();
          const timestamp = Date.now();
          const newSession: Session = {
            id,
            title,
            createdAt: timestamp,
            updatedAt: timestamp,
            category,
          };

          set((state) => ({
            ...state,
            sessions: [...state.sessions, newSession],
            activeSessionId: id,
          }));

          await persistSnapshot();
          return id;
        },
        createOrGetActive: async (autoTitle?: string) => {
          const { sessions, activeSessionId, addSession, setActiveSession } =
            get();

          const hasActive =
            activeSessionId &&
            sessions.some((session) => session.id === activeSessionId);

          if (hasActive && sessions.length > 0) {
            return activeSessionId!;
          }

          const fallbackName =
            autoTitle && autoTitle.trim().length > 0
              ? autoTitle.trim()
              : `New Workspace ${new Date().toLocaleTimeString()}`;

          const newId = await addSession(fallbackName, "Other");
          setActiveSession(newId);

          try {
            await localforage.setItem("filon-active-session", newId);
          } catch (error) {
            console.warn("Failed to persist active session id", error);
          }

          return newId;
        },
        removeSession: (id) => {
          get().deleteSession(id);
        },
        deleteSession: async (id) => {
          const { sessions, activeSessionId } = get();
          const updatedSessions = sessions.filter((s) => s.id !== id);

          set((state) => ({
            ...state,
            sessions: updatedSessions,
            activeSessionId:
              state.activeSessionId === id ? null : state.activeSessionId,
          }));

          await localforage.setItem(STORAGE_KEY, {
            state: {
              sessions: updatedSessions,
              activeSessionId: activeSessionId === id ? null : activeSessionId,
              pendingThoughts: get().pendingThoughts,
            },
            version: 0,
            payload: latestPersistPayload,
          });

          if (typeof window !== "undefined" && activeSessionId === id) {
            window.history.replaceState({}, "", "/");
          }
        },
        closeSession: (id) => {
          set((state) => ({
            ...state,
            sessions: state.sessions.filter((s) => s.id !== id),
            activeSessionId:
              state.activeSessionId === id ? null : state.activeSessionId,
          }));

          void persistSnapshot();
        },
        openSession: (session) => {
          set((state) => {
            const exists = state.sessions.some((s) => s.id === session.id);
            const sessions = exists
              ? state.sessions.map((s) => (s.id === session.id ? session : s))
              : [...state.sessions, session];
            return { ...state, sessions, activeSessionId: session.id };
          });

          void persistSnapshot();
        },
        updateSessionTitle: (id, title) => {
          const normalized = title.trim();
          if (!normalized) return;

          set((state) => ({
            ...state,
            sessions: state.sessions.map((s) =>
              s.id === id
                ? { ...s, title: normalized, updatedAt: Date.now() }
                : s
            ),
          }));

          void persistSnapshot();
        },
        generateTitleFromThought: (content) => {
          const cleaned = content.trim();
          if (!cleaned) return "Untitled Workspace";

          const words = cleaned
            .replace(/\s+/g, " ")
            .split(" ")
            .filter(Boolean)
            .slice(0, 6)
            .map((word) =>
              word.length > 1
                ? word[0].toUpperCase() + word.slice(1).toLowerCase()
                : word.toUpperCase()
            );

          const title = words.join(" ");
          return title || "Untitled Workspace";
        },
        setActiveSession: (id) => {
          set((state) => ({ ...state, activeSessionId: id }));
          void persistSnapshot();
        },
        getLastActive: () => get().activeSessionId,
        updateMetadata: (id, meta) => {
          set((state) => ({
            ...state,
            sessions: state.sessions.map((s) => {
              if (s.id !== id) return s;
              const existingMeta = s.meta ?? {
                nodeCount: 0,
                edgeCount: 0,
                lastSaved: Date.now(),
              };
              return {
                ...s,
                meta: {
                  ...existingMeta,
                  ...meta,
                } as Session["meta"],
                updatedAt: Date.now(),
              };
            }),
          }));

          void persistSnapshot();
        },
        updateCategory: (id, category) => {
          set((state) => ({
            ...state,
            sessions: state.sessions.map((s) =>
              s.id === id ? { ...s, category, updatedAt: Date.now() } : s
            ),
          }));

          void persistSnapshot();
        },
        enqueueThought: ({ sessionId, content, thoughtType }) => {
          const item: PendingThought = {
            id: crypto.randomUUID(),
            sessionId,
            content,
            thoughtType,
            createdAt: Date.now(),
          };

          set((state) => ({
            ...state,
            pendingThoughts: [...state.pendingThoughts, item],
          }));

          void persistSnapshot();
          return item.id;
        },
        drainThoughtsForSession: async (sessionId) => {
          const all = get().pendingThoughts;
          const mine = all.filter((t) => t.sessionId === sessionId);
          if (!mine.length) return [];
          const rest = all.filter((t) => t.sessionId !== sessionId);

          set((state) => ({ ...state, pendingThoughts: rest }));
          await persistSnapshot();
          return mine;
        },
        setGraphLoadedOnce: (loaded) => {
          set((state) => ({
            ...state,
            graphLoadedOnce: loaded,
          }));
        },
      };
    },
    {
      name: STORAGE_KEY,
      storage,
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        pendingThoughts: state.pendingThoughts,
      }),
    }
  )
);

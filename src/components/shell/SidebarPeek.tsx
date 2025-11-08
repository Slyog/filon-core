"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { Clock, FolderPlus, X, ChevronRight } from "lucide-react";
import { useUISettingsStore } from "@/store/uiSettingsStore";
import { useSessionStore } from "@/store/SessionStore";

const MAX_RECENT = 5;

const relativeTime = (timestamp: number) => {
  const delta = Date.now() - timestamp;
  const minutes = Math.round(delta / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

export default function SidebarPeek() {
  const pathname = usePathname();
  const router = useRouter();
  const open = useUISettingsStore((state) => state.showSidebarPeek);
  const setOpen = useUISettingsStore((state) => state.setShowSidebarPeek);
  const close = useUISettingsStore((state) => state.closeSidebarPeek);

  const sessions = useSessionStore((state) => state.sessions);
  const addSession = useSessionStore((state) => state.addSession);
  const setActiveSession = useSessionStore((state) => state.setActiveSession);

  const recents = useMemo(
    () =>
      [...sessions]
        .sort(
          (a, b) =>
            (b.updatedAt ?? b.createdAt ?? 0) -
            (a.updatedAt ?? a.createdAt ?? 0)
        )
        .slice(0, MAX_RECENT),
    [sessions]
  );

  const lastSessionId = useSessionStore((state) => state.activeSessionId);
  const hasRecents = recents.length > 0;

  const handleOpenWorkspace = useCallback(
    (id: string) => {
      close();
      setActiveSession(id);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("lastWorkspaceId", id);
        } catch (_error) {
          // Ignore storage limitations
        }
      }
      router.push(`/f/${id}`);
    },
    [close, setActiveSession, router]
  );

  const handleCreateWorkspace = useCallback(async () => {
    const id = await addSession("New Workspace");
    close();
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("lastWorkspaceId", id);
      } catch (_error) {
        // Ignore storage limitations
      }
    }
    router.push(`/f/${id}`);
  }, [addSession, close, router]);

  const handleOpenLast = useCallback(() => {
    if (!lastSessionId) return;
    handleOpenWorkspace(lastSessionId);
  }, [handleOpenWorkspace, lastSessionId]);

  const isHome = pathname === "/";

  return (
    <Dialog.Root open={open && isHome} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-[#05090c]/60 backdrop-blur-sm" />
        <Dialog.Content asChild>
          <motion.div
            aria-label="Workspace sidebar peek"
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ duration: 0.14, ease: [0.25, 0.8, 0.4, 1] }}
            className="fixed inset-y-0 left-0 z-[80] w-[320px] max-w-[calc(100%-48px)] overflow-y-auto border-r border-cyan-500/20 bg-[#051219]/95 px-6 py-8 text-cyan-100 shadow-xl focus-visible:outline-none"
          >
            <div className="flex items-start justify-between">
              <div>
                <Dialog.Title className="text-base font-normal tracking-wide text-cyan-100">
                  Workspace Peek
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm font-light text-cyan-100/70">
                  Jump back into a canvas or spin up a clean slate.
                </Dialog.Description>
              </div>
              <Dialog.Close
                className="rounded-md p-2 text-cyan-100/70 transition hover:bg-cyan-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                aria-label="Close workspace peek"
              >
                <X size={16} strokeWidth={1.5} />
              </Dialog.Close>
            </div>

            <div className="mt-8 space-y-8">
              <section className="space-y-4" aria-labelledby="peek-new">
                <h2
                  id="peek-new"
                  className="text-sm font-normal uppercase tracking-[0.24em] text-cyan-200/80"
                >
                  Create
                </h2>
                <button
                  type="button"
                  onClick={handleCreateWorkspace}
                  className="flex w-full items-center justify-between rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-left text-sm font-light text-cyan-50 transition hover:border-cyan-300/40 hover:bg-cyan-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <span className="inline-flex items-center gap-3">
                    <FolderPlus size={18} strokeWidth={1.5} />
                    New workspace
                  </span>
                  <ChevronRight size={18} strokeWidth={1.5} />
                </button>
              </section>

              <section className="space-y-4" aria-labelledby="peek-recents">
                <h2
                  id="peek-recents"
                  className="text-sm font-normal uppercase tracking-[0.24em] text-cyan-200/80"
                >
                  Recent
                </h2>
                <div className="space-y-3">
                  {hasRecents ? (
                    recents.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => handleOpenWorkspace(session.id)}
                        className="group flex w-full items-center justify-between rounded-lg border border-transparent px-4 py-3 text-left transition hover:border-cyan-300/40 hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                      >
                        <span className="flex flex-col gap-1">
                          <span className="text-sm font-light text-cyan-50">
                            {session.title || "Untitled Workspace"}
                          </span>
                          <span className="flex items-center gap-2 text-xs font-normal text-cyan-200/70">
                            <Clock size={14} strokeWidth={1.25} />
                            {relativeTime(session.updatedAt ?? session.createdAt)}
                          </span>
                        </span>
                        <ChevronRight
                          size={18}
                          strokeWidth={1.5}
                          className="text-cyan-200/60 transition group-hover:text-cyan-200"
                        />
                      </button>
                    ))
                  ) : (
                    <p className="rounded-lg border border-cyan-500/10 bg-cyan-500/5 px-4 py-3 text-sm font-light text-cyan-100/60">
                      Workspaces you open will show up here.
                    </p>
                  )}
                </div>
              </section>

              <section className="space-y-4" aria-labelledby="peek-last">
                <h2
                  id="peek-last"
                  className="text-sm font-normal uppercase tracking-[0.24em] text-cyan-200/80"
                >
                  Continue
                </h2>
                <button
                  type="button"
                  onClick={handleOpenLast}
                  disabled={!lastSessionId}
                  className="flex w-full items-center justify-between rounded-lg border border-cyan-500/20 px-4 py-3 text-left text-sm font-light text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:border-cyan-500/10 disabled:text-cyan-200/40 disabled:hover:bg-transparent"
                >
                  <span className="inline-flex items-center gap-3">
                    <Clock size={18} strokeWidth={1.5} />
                    Open last workspace
                  </span>
                  <ChevronRight size={18} strokeWidth={1.5} />
                </button>
              </section>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


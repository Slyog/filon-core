"use client";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ActiveNodeProvider } from "@/context/ActiveNodeContext";
import { MindProgressProvider } from "@/context/MindProgressContext";
import { useSessionStore } from "@/store/SessionStore";
import Sidebar from "@/components/Sidebar";
import SessionTabs from "@/components/SessionTabs";
import WorkspaceList from "@/components/WorkspaceList";
import WorkspaceHeader from "@/components/WorkspaceHeader";

const GraphCanvas = dynamic(
  () => import("@/components/GraphCanvas.client").then((mod) => mod.default),
  { ssr: false }
);

export default function WorkspaceShell({
  children,
  sessionId,
}: {
  children?: ReactNode;
  sessionId?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const sessions = useSessionStore((s) => s.sessions);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);

  // 🔹 Set active session from URL if not already set
  useEffect(() => {
    if (!activeSessionId && pathname?.startsWith("/f/")) {
      const idFromUrl = pathname.split("/f/")[1];
      if (idFromUrl) {
        const session = sessions.find((s) => s.id === idFromUrl);
        if (session) {
          setActiveSession(idFromUrl);
          return;
        }
      }
    }
  }, [pathname, activeSessionId, sessions, setActiveSession]);

  useEffect(() => {
    if (!activeSessionId && pathname?.startsWith("/f/")) {
      router.replace("/");
    }
  }, [activeSessionId, pathname, router]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const current = sessions.find((s) => s.id === activeSessionId);
    document.title = current?.title
      ? `FILON — ${current.title}`
      : "FILON — Visual Workspace";
  }, [sessions, activeSessionId]);

  return (
    <ActiveNodeProvider>
      <MindProgressProvider>
        <div className="workspace-grid min-h-screen bg-[#0A0F12] text-white relative">
          {/* Header */}
          <header className="fixed top-0 left-0 w-full h-12 flex items-center justify-between px-6 border-b border-white/10 bg-[rgba(10,15,18,0.7)] backdrop-blur-md z-50">
            <h1 className="font-semibold tracking-wide text-cyan-400">FILON</h1>
            <div className="text-xs opacity-70">Visual Workspace Alpha</div>
          </header>

          {/* Workspace List */}
          <div className="fixed top-12 left-0 w-full z-40">
            <WorkspaceList />
          </div>

          {/* Workspace Header */}
          <div className="fixed top-[60px] left-0 w-full z-[39]">
            <WorkspaceHeader />
          </div>

          {/* Session Tabs Bar - positioned below WorkspaceHeader */}
          <div className="fixed top-[108px] left-0 w-full z-38">
            <SessionTabs />
          </div>

          {/* Body */}
          <main className="flex flex-1 overflow-hidden pt-[140px]">
            <aside className="w-64 border-r border-white/10">
              <Sidebar />
            </aside>
            <section className="flex-1 relative overflow-hidden">
              {children || <GraphCanvas sessionId={sessionId} />}
            </section>
          </main>
        </div>
      </MindProgressProvider>
    </ActiveNodeProvider>
  );
}

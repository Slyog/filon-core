"use client";
import { ReactNode } from "react";
import dynamic from "next/dynamic";
import { ActiveNodeProvider } from "@/context/ActiveNodeContext";
import { MindProgressProvider } from "@/context/MindProgressContext";
import Sidebar from "@/components/Sidebar";

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
  return (
    <ActiveNodeProvider>
      <MindProgressProvider>
        <div className="workspace-grid min-h-screen bg-[#0A0F12] text-white relative">
          {/* Header */}
          <header className="flex items-center justify-between px-4 h-12 border-b border-white/10">
            <h1 className="font-semibold tracking-wide text-cyan-400">FILON</h1>
            <div className="text-xs opacity-70">Visual Workspace Alpha</div>
          </header>

          {/* Body */}
          <main className="flex flex-1 overflow-hidden">
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

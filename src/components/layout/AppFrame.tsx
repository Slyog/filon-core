"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import ContextStream from "./ContextStream";
import { Brainbar } from "./Brainbar";

type AppFrameProps = {
  children: ReactNode;
};

export default function AppFrame({ children }: AppFrameProps) {
  return (
    <div className="grid h-screen w-screen grid-cols-[280px_minmax(0,1fr)_340px] bg-filon-bg text-filon-text">
      {/* LEFT SIDEBAR */}
      <div className="col-span-1 col-start-1 h-full">
        <Sidebar />
      </div>

      {/* MAIN AREA */}
      <div className="relative col-span-1 col-start-2 flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-gradient-to-b from-filon-bg via-filon-bg to-[#050505] border-l border-filon-border/30 shadow-[inset_1px_0_0_rgba(0,0,0,0.6)]">
        <Brainbar />
        <main className="relative flex-1 min-h-0 min-w-0 overflow-hidden">
          {children}
        </main>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="col-span-1 col-start-3 h-full border-l border-filon-border/60">
        <ContextStream />
      </div>
    </div>
  );
}

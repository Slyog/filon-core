"use client";

import { Sidebar } from "./Sidebar";
import { Brainbar } from "./Brainbar";
import { ContextStream } from "./ContextStream";

export function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-screen bg-filon-bg text-filon-text grid grid-cols-[260px_1fr_320px]">
      <Sidebar />

      <div className="flex flex-col border-x border-filon-border">
        <Brainbar />
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>

      <ContextStream />
    </div>
  );
}


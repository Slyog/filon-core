"use client";

import { Sidebar } from "./Sidebar";
import { Brainbar } from "./Brainbar";
import { ContextStream } from "./ContextStream";

export function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-full w-full grid-cols-[280px_1fr_320px] bg-filon-bg text-filon-text">
      <div className="col-start-1 col-span-1 h-full overflow-hidden">
        <Sidebar />
      </div>

      <div className="col-start-2 col-span-1 flex h-full w-full flex-col overflow-hidden relative z-0 border-x border-filon-border">
        <Brainbar />
        <main className="flex-1 w-full h-full overflow-hidden relative" role="main" aria-label="Main content">
          {children}
        </main>
      </div>

      <ContextStream className="col-start-3 col-span-1" />
    </div>
  );
}

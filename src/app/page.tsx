"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import ContextStream from "@/components/layout/ContextStream";
import { Brainbar } from "@/components/layout/Brainbar";
import { CanvasRoot } from "@/components/canvas/CanvasRoot";

export default function Home() {
  return (
    <div className="grid grid-cols-[280px_1fr_320px] w-full h-full overflow-hidden">
      <div className="col-start-1 col-span-1 h-full border-r border-filon-border overflow-y-auto">
        <Sidebar />
      </div>

      <div className="col-start-2 col-span-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        <Brainbar />
        <main className="flex-1 min-h-0 min-w-0 overflow-hidden">
          <CanvasRoot />
        </main>
      </div>

      <div className="col-start-3 col-span-1 h-full border-l border-filon-border overflow-hidden flex flex-col">
        <ContextStream />
      </div>
    </div>
  );
}

"use client";

import { Sidebar } from "./Sidebar";
import ContextStream from "./ContextStream";
import { Brainbar } from "./Brainbar";

export default function AppFrame({ children }) {
  return (
    <div className="h-screen w-screen grid grid-cols-[280px_minmax(0,1fr)_320px]">
      
      {/* LEFT SIDEBAR */}
      <div className="col-start-1 col-span-1 h-full border-r border-filon-border overflow-y-auto">
        <Sidebar />
      </div>

      {/* MAIN AREA */}
      <div className="col-start-2 col-span-1 relative flex flex-col min-h-0 min-w-0 overflow-hidden">
        <Brainbar />
        <main className="relative flex-1 min-h-0 min-w-0 overflow-hidden">
          {children}
        </main>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="col-start-3 col-span-1 h-full border-l border-filon-border overflow-hidden flex flex-col min-h-0">
        <ContextStream />
      </div>
    </div>
  );
}

"use client";

import { useUIShellStore } from "@/store/UIShellStore";
import ContextStream from "@/components/panels/ContextStream";
import AISummarizer from "@/components/panels/AISummarizer";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarOpen = useUIShellStore((state) => state.sidebarOpen);
  const hasContext = false;

  return (
    <div className="relative flex h-screen w-screen bg-[#0A0F12] overflow-hidden text-cyan-200">
      {/* Main Graph Area - reserves space for sidebar */}
      <div
        className="flex-1 relative overflow-hidden transition-[margin] duration-300 ease-in-out"
        style={{
          marginLeft: sidebarOpen ? "256px" : "80px",
          transition: "margin-left 0.25s cubic-bezier(0.25, 1, 0.5, 1)",
        }}
      >
        {children}

        {/* Docked Panels */}
        {hasContext && (
          <div className="absolute bottom-0 left-0 right-0 z-20 flex border-t border-cyan-400/10 bg-black/20 backdrop-blur-md pointer-events-none">
            <div
              role="complementary"
              aria-label="Context Stream"
              className="w-1/2 border-r border-cyan-400/10 pointer-events-auto"
            >
              <ContextStream />
            </div>
            <div
              role="complementary"
              aria-label="AI Summarizer"
              className="w-1/2 pointer-events-auto"
            >
              <AISummarizer />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


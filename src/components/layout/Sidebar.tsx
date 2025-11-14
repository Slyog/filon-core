"use client";

import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useUIShellStore, useHydrateUIShell } from "@/store/UIShellStore";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  useHydrateUIShell();
  const sidebarOpen = useUIShellStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIShellStore((state) => state.toggleSidebar);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <aside
        className="hidden md:flex h-full flex-col bg-filon-surface text-filon-text border-r border-filon-border transition-all duration-300 relative z-20 pointer-events-auto"
        style={{ width: "64px" }}
        aria-label="Sidebar"
      >
        <div className="h-full flex items-center justify-center">
          <div className="w-8 h-8 bg-filon-border rounded animate-pulse" />
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "hidden md:flex h-full flex-col bg-filon-surface text-filon-text border-r border-filon-border transition-all duration-300 relative z-20 pointer-events-auto",
        sidebarOpen ? "w-64 min-w-[240px]" : "w-16 min-w-[64px]"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden absolute -right-3 top-4 z-30 w-6 h-6 rounded-full bg-filon-surface border border-filon-border flex items-center justify-center hover:bg-filon-bg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-filon-accent focus-visible:ring-offset-2 focus-visible:ring-offset-filon-surface pointer-events-auto"
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        aria-expanded={sidebarOpen}
        tabIndex={0}
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-4 h-4 text-filon-text" />
        ) : (
          <ChevronRight className="w-4 h-4 text-filon-text" />
        )}
      </button>

      {/* Sidebar Content */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {sidebarOpen ? (
          <>
            <h1 className="text-lg font-semibold mb-4 text-filon-text">
              FILON
            </h1>
            <Separator className="mb-4 bg-filon-border" />

            <nav className="flex flex-col gap-2" role="navigation" aria-label="Navigation menu">
              <Button
                variant="outline"
                className="justify-start border-filon-border hover:bg-filon-bg focus-visible:ring-filon-accent"
                role="button"
                tabIndex={0}
              >
                Dashboard
              </Button>
              <Button
                variant="outline"
                className="justify-start border-filon-border hover:bg-filon-bg focus-visible:ring-filon-accent"
                role="button"
                tabIndex={0}
              >
                Workspaces
              </Button>
              <Button
                variant="outline"
                className="justify-start border-filon-border hover:bg-filon-bg focus-visible:ring-filon-accent"
                role="button"
                tabIndex={0}
              >
                Settings
              </Button>
            </nav>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 pt-2">
            <div className="w-8 h-8 rounded bg-filon-accent/20 flex items-center justify-center">
              <span className="text-xs font-bold text-filon-accent">F</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

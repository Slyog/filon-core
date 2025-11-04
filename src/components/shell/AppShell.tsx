"use client";

import { PropsWithChildren } from "react";
import { motion } from "framer-motion";
import HeaderBar from "./HeaderBar";
import SidebarNav from "./Sidebar";
import { useHydrateUIShell } from "@/store/UIShellStore";

export default function AppShell({ children }: PropsWithChildren) {
  useHydrateUIShell();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen grid grid-rows-[auto,1fr,auto] bg-[#0A0F12] text-gray-100"
    >
      {/* Header */}
      <div className="row-start-1">
        <HeaderBar />
      </div>

      {/* Main Content Area with Sidebar */}
      <main className="row-start-2 flex overflow-hidden">
        {/* Sidebar - bereits animiert in SidebarNav Komponente */}
        <SidebarNav />

        {/* Centered Content Container */}
        <div className="flex-1 overflow-y-auto">
          <motion.div
            layout
            className="relative flex flex-col items-center justify-center min-h-[75vh] mx-auto w-full max-w-7xl p-6"
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="row-start-3 py-4 text-center text-xs text-gray-500/70 border-t border-cyan-900/40">
        FILON Core v0.1 • Grid Aligned
      </footer>
    </motion.div>
  );
}

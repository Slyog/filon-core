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
      className="min-h-screen flex flex-col bg-base text-neutral-200 transition-colors duration-200"
    >
      <HeaderBar />
      <main className="flex flex-1 overflow-hidden">
        <SidebarNav />
        <div className="flex-1 min-h-[calc(100vh-48px)] px-6 pb-10">
          {children}
        </div>
      </main>
    </motion.div>
  );
}

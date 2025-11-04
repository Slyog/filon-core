"use client";

import { PropsWithChildren } from "react";
import HeaderBar from "./HeaderBar";
import SidebarNav from "./Sidebar";
import { useHydrateUIShell } from "@/store/UIShellStore";

export default function AppShell({ children }: PropsWithChildren) {
  useHydrateUIShell();

  return (
    <div className="min-h-screen bg-[#0A0F12] text-zinc-200">
      <HeaderBar />
      <div className="flex pt-12">
        <SidebarNav />
        <main className="flex-1 min-h-[calc(100vh-48px)] px-6 pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}

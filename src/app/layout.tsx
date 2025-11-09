"use client";

import "./globals.css";

import { HomePeekSidebar } from "@/components/HomePeekSidebar";
import LayoutDebugOverlay from "@/components/dev/LayoutDebugOverlay";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#0A0F12] text-cyan-100" suppressHydrationWarning>
        <div className="layout-root flex flex-row h-screen w-screen overflow-hidden">
          {/* SIDEBAR */}
          <aside className="layout-aside fixed left-0 top-0 h-full w-[15rem] bg-neutral-950/90 border-r border-cyan-300/15 text-cyan-200 shadow-[0_0_20px_#2FF3FF22] backdrop-blur-md z-30 flex flex-col justify-between">
            <HomePeekSidebar />
          </aside>

          {/* MAIN */}
          <main className="layout-main relative z-20 flex-1 ml-[15rem] min-h-screen overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center">
            {children}
          </main>
        </div>

        <LayoutDebugOverlay />
      </body>
    </html>
  );
}

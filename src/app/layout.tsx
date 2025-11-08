"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import HomePeekSidebar from "@/components/HomePeekSidebar";

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isHome = pathname === "/";

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_QA_MODE !== "true") {
      return;
    }

    document.documentElement.classList.add("qa-mode");
    return () => {
      document.documentElement.classList.remove("qa-mode");
    };
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning={true}
        className="flex min-h-screen flex-row overflow-hidden bg-[#0A0F12] text-cyan-100"
      >
        {/* SIDEBAR */}
        <aside className="fixed left-0 top-0 z-30 h-screen w-60 border-r border-cyan-300/15 bg-neutral-950/80 text-cyan-200 shadow-[0_0_20px_#2FF3FF22] backdrop-blur-md">
          <HomePeekSidebar />
        </aside>

        {/* MAIN CONTENT */}
        <main className="relative z-20 ml-60 flex min-h-screen w-full flex-col overflow-y-auto bg-[#05090d]">
          {children}
        </main>
      </body>
    </html>
  );
}

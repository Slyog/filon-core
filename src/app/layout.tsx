"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import "./globals.css";
import HomePeekSidebar from "@/components/HomePeekSidebar";

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isHome = pathname === "/";

  return (
    <html lang="en">
      <body className="relative bg-[#0A0F12] text-cyan-100">
        <HomePeekSidebar />
        {isHome ? children : <div className="pt-4">{children}</div>}
      </body>
    </html>
  );
}

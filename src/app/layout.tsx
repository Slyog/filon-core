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
    <html lang="en">
      <body className="relative bg-[#0A0F12] text-cyan-100">
        <HomePeekSidebar />
        {isHome ? children : <div className="pt-4">{children}</div>}
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";

export function HomePeekSidebar() {
  return (
    <nav className="flex flex-col gap-3 p-4 text-sm tracking-wide">
      <Link href="/qa/dashboard" className="transition hover:text-cyan-400">
        QA Dashboard
      </Link>
      <Link href="/" className="transition hover:text-cyan-400">
        Home
      </Link>
    </nav>
  );
}

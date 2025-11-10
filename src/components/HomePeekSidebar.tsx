"use client";

import Image from "next/image";
import Link from "next/link";

import FilonLogo from "@/app/filon-logo/filon-logo-transparent.png";

export function HomePeekSidebar() {
  return (
    <nav className="flex h-full flex-col items-center gap-6 p-4 text-sm tracking-wide">
      <Link href="/" aria-label="FILON Home" className="shrink-0">
        <div className="filon-logo relative h-14 w-14">
          <Image
            src={FilonLogo}
            alt="FILON Logo"
            fill
            priority
            className="object-contain"
          />
        </div>
      </Link>

      <div className="flex w-full flex-col gap-3">
        <Link
          href="/qa/dashboard"
          className="transition hover:text-cyan-400"
        >
          QA Dashboard
        </Link>
        <Link href="/" className="transition hover:text-cyan-400">
          Home
        </Link>
      </div>
    </nav>
  );
}

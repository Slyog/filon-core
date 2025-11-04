"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type SectionProps = {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  collapsed?: boolean;
};

export default function Section({
  title,
  icon,
  children,
  defaultOpen = true,
  collapsed = false,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        {children}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:bg-zinc-900"
      >
        {icon}
        <span>{title}</span>
        <ChevronDown
          size={12}
          className={`ml-auto transition-transform ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>
      {open && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  );
}

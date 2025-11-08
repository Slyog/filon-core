"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Folder, Brain, Waves, Settings, LogIn, Archive } from "lucide-react";

export default function HomePeekSidebar() {
  const [open, setOpen] = useState(false);

  const sections = [
    {
      title: "WORKSPACES",
      items: [{ icon: Folder, label: "Active" }],
    },
    {
      title: "PANELS",
      items: [
        { icon: Brain, label: "AI Summarizer" },
        { icon: Waves, label: "Context Stream" },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        { icon: Settings, label: "Settings" },
        { icon: LogIn, label: "Login" },
        { icon: Archive, label: "Archive" },
      ],
    },
  ] as const;

  return (
    <motion.aside
      animate={{ width: open ? 200 : 64 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col items-start overflow-y-auto border-r border-cyan-400/20 bg-slate-950/60 px-0 pt-4 backdrop-blur-md"
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="self-center mb-4 text-cyan-300/80 transition hover:text-cyan-200"
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
      >
        ☰
      </button>

      <nav className="flex w-full flex-col gap-6 px-2">
        {sections.map((section) => (
          <div key={section.title}>
            {open && (
              <p className="mb-1 ml-2 text-[10px] uppercase tracking-wider text-cyan-400/60">
                {section.title}
              </p>
            )}
            {section.items.map(({ icon: Icon, label }) => (
              <button
                key={label}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-cyan-300/80 transition-colors hover:bg-cyan-400/10 hover:text-cyan-200"
              >
                <Icon className="h-5 w-5" />
                {open && <span className="text-sm font-medium">{label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </motion.aside>
  );
}

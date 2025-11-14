"use client";

import { cn } from "@/lib/utils";

type SidebarListItem = {
  id: string;
  label: string;
  meta?: string;
  active?: boolean;
};

type SidebarSection = {
  id: string;
  title: string;
  items: SidebarListItem[];
};

const sections: SidebarSection[] = [
  {
    id: "workspaces",
    title: "Workspaces",
    items: [
      { id: "ws-1", label: "FILON Core Lab", meta: "Now", active: true },
      { id: "ws-2", label: "Strategy Room", meta: "Today" },
      { id: "ws-3", label: "Archive / 2024", meta: "Idle" },
    ],
  },
  {
    id: "goals",
    title: "Goals",
    items: [
      { id: "goal-1", label: "Stabilize v4 shells", meta: "72%" },
      { id: "goal-2", label: "Map deep-work rituals", meta: "48%" },
      { id: "goal-3", label: "QA pass for launch", meta: "In review" },
    ],
  },
  {
    id: "tracks",
    title: "Tracks",
    items: [
      { id: "track-1", label: "Design Systems" },
      { id: "track-2", label: "Knowledge Graph" },
      { id: "track-3", label: "Context Stream" },
    ],
  },
  {
    id: "steps",
    title: "Steps",
    items: [
      { id: "step-1", label: "Define UI spec" },
      { id: "step-2", label: "Refine Brainbar copy" },
      { id: "step-3", label: "Polish stream cards" },
    ],
  },
];

export function Sidebar() {
  return (
    <aside
      role="navigation"
      aria-label="Workspace navigation"
      className="flex h-full flex-col bg-filon-surface/80 text-filon-text backdrop-blur-sm supports-[backdrop-filter]:bg-filon-surface/70"
    >
      <div className="border-b border-filon-border/60 px-5 py-4">
        <p className="text-[11px] uppercase tracking-[0.35em] text-filon-text/50">
          Workspace
        </p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-filon-text">FILON</p>
            <p className="text-sm text-filon-text/60">Deep work Lab</p>
          </div>
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full bg-filon-accent shadow-[0_0_12px_rgba(47,243,255,0.55)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <SidebarSectionBlock key={section.id} section={section} />
          ))}
        </div>
      </div>
    </aside>
  );
}

function SidebarSectionBlock({ section }: { section: SidebarSection }) {
  return (
    <section aria-labelledby={`sidebar-${section.id}`}>
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-filon-text/50">
        <span id={`sidebar-${section.id}`}>{section.title}</span>
        <span className="text-filon-text/35">
          {section.items.length.toString().padStart(2, "0")}
        </span>
      </div>

      <ul className="mt-3 space-y-1.5">
        {section.items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={cn(
                "group flex w-full items-center justify-between rounded-lg border border-transparent px-3 py-2 text-left text-sm text-filon-text/65 transition hover:border-filon-border/70 hover:text-filon-text/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-filon-accent/70 focus-visible:ring-offset-0",
                item.active &&
                  "border-filon-accent/50 bg-filon-border/40 text-filon-text shadow-[0_0_30px_rgba(47,243,255,0.15)]"
              )}
              aria-current={item.active ? "page" : undefined}
            >
              <span className="truncate">{item.label}</span>
              {item.meta && (
                <span className="text-xs text-filon-text/45">{item.meta}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

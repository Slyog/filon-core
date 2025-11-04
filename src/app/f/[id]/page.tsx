"use client";

import { use } from "react";
import AppShell from "@/components/shell/AppShell";
import ComposerPanel from "@/components/ComposerPanel";
import GraphCanvas from "@/components/GraphCanvas.client";

export default function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        <ComposerPanel />
        <div className="min-h-[600px] rounded-2xl border border-zinc-800 bg-black/40 shadow-lg">
          <GraphCanvas sessionId={id} />
        </div>
      </div>
    </AppShell>
  );
}

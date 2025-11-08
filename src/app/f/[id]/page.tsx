"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/shell/AppShell";
import ComposerPanel from "@/components/ComposerPanel";
import GraphCanvas from "@/components/GraphCanvas.client";
import { useSessionStore } from "@/store/SessionStore";

export default function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const enqueueThought = useSessionStore((state) => state.enqueueThought);
  const [graphInitialized, setGraphInitialized] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !graphInitialized) {
      // Enqueue the initial thought
      enqueueThought({
        sessionId: id,
        content: q,
        thoughtType: "Idea",
      });
      setGraphInitialized(true);
    }
  }, [searchParams, id, enqueueThought, graphInitialized]);

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

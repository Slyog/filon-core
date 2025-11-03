"use client";

import dynamic from "next/dynamic";
import { ActiveNodeProvider } from "@/context/ActiveNodeContext";
import { MindProgressProvider } from "@/context/MindProgressContext";

const GraphCanvas = dynamic(
  () => import("@/components/GraphCanvas.client").then((mod) => mod.default),
  { ssr: false }
);

export default function Page() {
  return (
    <ActiveNodeProvider>
      <MindProgressProvider>
        <main className="h-full w-full bg-filon-bg text-filon-text overflow-hidden">
          <GraphCanvas />
        </main>
      </MindProgressProvider>
    </ActiveNodeProvider>
  );
}

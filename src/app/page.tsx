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
        <main className="min-h-screen bg-noion-dark text-white p-4 flex flex-col gap-6">
          <GraphCanvas />
        </main>
      </MindProgressProvider>
    </ActiveNodeProvider>
  );
}

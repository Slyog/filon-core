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
        <main className="min-h-screen flex flex-col w-full bg-filon-bg text-filon-text">
          <GraphCanvas />
        </main>
      </MindProgressProvider>
    </ActiveNodeProvider>
  );
}

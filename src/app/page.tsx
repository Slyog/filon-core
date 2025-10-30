"use client";

import dynamic from "next/dynamic";
import { ActiveNodeProvider } from "@/context/ActiveNodeContext";

const GraphCanvas = dynamic(
  () => import("@/components/GraphCanvas.client").then((mod) => mod.default),
  { ssr: false }
);

export default function Page() {
  return (
    <ActiveNodeProvider>
      <main className="min-h-screen bg-noion-dark text-white p-4 grid grid-cols-1 gap-6">
        <GraphCanvas />
      </main>
    </ActiveNodeProvider>
  );
}

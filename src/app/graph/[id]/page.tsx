"use client";

import dynamic from "next/dynamic";
import { ActiveNodeProvider } from "@/context/ActiveNodeContext";
import { MindProgressProvider } from "@/context/MindProgressContext";

const GraphCanvas = dynamic(
  () => import("@/components/GraphCanvas.client").then((mod) => mod.default),
  { ssr: false }
);

export default function GraphPage({ params }: { params: { id: string } }) {
  return (
    <ActiveNodeProvider>
      <MindProgressProvider>
        <GraphCanvas sessionId={params.id} />
      </MindProgressProvider>
    </ActiveNodeProvider>
  );
}

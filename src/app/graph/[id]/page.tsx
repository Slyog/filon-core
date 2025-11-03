"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { ActiveNodeProvider } from "@/context/ActiveNodeContext";
import { MindProgressProvider } from "@/context/MindProgressContext";

const GraphCanvas = dynamic(
  () => import("@/components/GraphCanvas.client").then((mod) => mod.default),
  { ssr: false }
);

export default function GraphPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ActiveNodeProvider>
      <MindProgressProvider>
        <GraphCanvas sessionId={id} />
      </MindProgressProvider>
    </ActiveNodeProvider>
  );
}

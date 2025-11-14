"use client";

import { useEffect } from "react";
import { ReactFlowProvider } from "reactflow";
import { FlowCanvas } from "./FlowCanvas";

export function CanvasRoot() {
  useEffect(() => {
    const host = document.querySelector<HTMLElement>("[data-id='canvas-host']");
    if (!host) return;

    const cx = host.clientWidth / 2;
    const cy = host.clientHeight / 2;

    const reactflow = (window as any).__reactflow;
    if (reactflow?.setViewport) {
      reactflow.setViewport({ x: cx, y: cy, zoom: 1 }, { duration: 0 });
    }
  }, []);

  return (
    <div
      className="relative w-full h-full min-h-0 min-w-0 overflow-hidden"
      data-id="canvas-host"
    >
      <ReactFlowProvider>
        <FlowCanvas onInit={(instance) => ((window as any).__reactflow = instance)} />
      </ReactFlowProvider>
    </div>
  );
}

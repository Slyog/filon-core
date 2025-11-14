"use client";

import { useEffect } from "react";
import { ReactFlowProvider } from "reactflow";
import { FlowCanvas } from "./FlowCanvas";

export function CanvasRoot() {
  useEffect(() => {
    const reactflow = (window as any).__reactflow;
    if (reactflow?.setViewport) {
      reactflow.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 0 });
    }
  }, []);

  return (
    <div
      className="relative w-full h-full min-h-0 min-w-0 overflow-hidden"
      data-id="canvas-host"
    >
      <ReactFlowProvider>
        <div className="relative w-full h-full overflow-hidden min-h-0 min-w-0">
          <div
            data-id="rf-clip-2"
            className="relative w-full h-full overflow-hidden min-h-0 min-w-0"
          >
            <FlowCanvas
              onInit={(instance) => ((window as any).__reactflow = instance)}
            />
          </div>
        </div>
      </ReactFlowProvider>
    </div>
  );
}

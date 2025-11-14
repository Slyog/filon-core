"use client";

import { ReactFlowProvider } from "reactflow";
import { FlowCanvas } from "./FlowCanvas";

export function CanvasRoot() {
  return (
    <div
      className="relative w-full h-full min-h-0 min-w-0 overflow-hidden"
      data-id="canvas-host"
    >
      <ReactFlowProvider>
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div
            data-id="rf-clip-2"
            className="absolute inset-0 w-full h-full overflow-hidden"
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

"use client";

import React, { useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MiniMap, useReactFlow } from "reactflow";
import { ZoomIn, ZoomOut } from "lucide-react";
import type { Node, Edge } from "reactflow";

interface GraphMiniMapProps {
  nodes?: Node[];
  edges?: Edge[];
  nodeColor?: (node: Node) => string;
  maskColor?: string;
}

export default function GraphMiniMap({
  nodes = [],
  edges = [],
  nodeColor,
  maskColor = "rgba(0, 0, 0, 0.6)",
}: GraphMiniMapProps) {
  const { getViewport, setViewport } = useReactFlow();
  const reduced = useReducedMotion();

  const defaultNodeColor = (node: Node) => {
    // TODO: Use theme colors from design tokens
    return node.selected ? "#06b6d4" : "#3b82f6";
  };

  // Pan viewport in small increments
  const nudge = useCallback(
    (dx: number, dy: number) => {
      const viewport = getViewport();
      const duration = reduced ? 0 : 150;
      setViewport(
        {
          x: viewport.x + dx,
          y: viewport.y + dy,
          zoom: viewport.zoom,
        },
        { duration }
      );
    },
    [getViewport, setViewport, reduced]
  );

  // Zoom in/out
  const handleZoom = useCallback(
    (delta: number) => {
      const viewport = getViewport();
      const newZoom = Math.max(0.1, Math.min(2, viewport.zoom + delta));
      const duration = reduced ? 0 : 150;
      setViewport(
        {
          x: viewport.x,
          y: viewport.y,
          zoom: newZoom,
        },
        { duration }
      );
    },
    [getViewport, setViewport, reduced]
  );

  // Keyboard controls for viewport navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input/textarea is focused
      const activeElement = document.activeElement as HTMLElement | null;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          (activeElement.isContentEditable ?? false))
      ) {
        return;
      }

      // Arrow keys for panning
      if (e.key === "ArrowUp") {
        e.preventDefault();
        nudge(0, 50);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        nudge(0, -50);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        nudge(50, 0);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nudge(-50, 0);
      }
      // +/- for zooming
      else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoom(0.1);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        handleZoom(-0.1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [nudge, handleZoom]);

  return (
    <motion.div
      className="absolute top-3 right-3 z-10"
      initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduced ? { duration: 0 } : { duration: 0.5 }}
      aria-description="Mini preview of the graph viewport"
    >
      <div className="bg-neutral-900/70 rounded-xl shadow-lg p-2 border border-neutral-800 overflow-hidden">
        {nodes.length > 0 ? (
          <>
            <MiniMap
              nodeColor={nodeColor || defaultNodeColor}
              maskColor={maskColor}
              pannable
              zoomable
              style={{
                backgroundColor: "rgba(17, 24, 39, 0.8)",
                width: 200,
                height: 150,
              }}
            />
            {/* Zoom controls */}
            <div className="flex gap-1 mt-2 justify-center">
              <button
                type="button"
                onClick={() => handleZoom(0.1)}
                aria-label="Zoom In"
                title="Zoom In (+)"
                className="px-2 py-1 rounded-md bg-neutral-800 text-xs text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleZoom(-0.1)}
                aria-label="Zoom Out"
                title="Zoom Out (-)"
                className="px-2 py-1 rounded-md bg-neutral-800 text-xs text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                <ZoomOut size={14} />
              </button>
            </div>
          </>
        ) : (
          <div className="w-[200px] h-[150px] flex items-center justify-center text-neutral-500 text-xs">
            Mini-Map Placeholder
            {/* TODO: Show empty state message */}
          </div>
        )}
      </div>
    </motion.div>
  );
}

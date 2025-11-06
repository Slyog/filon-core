"use client";

import React from "react";
import { motion } from "framer-motion";
import { MiniMap } from "reactflow";
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
  // TODO: Sync viewport with main ReactFlow instance
  // TODO: Add zoom controls
  // TODO: Add node filtering/coloring based on type/status
  // TODO: Add click-to-navigate functionality

  const defaultNodeColor = (node: Node) => {
    // TODO: Use theme colors from design tokens
    return node.selected ? "#06b6d4" : "#3b82f6";
  };

  return (
    <motion.div
      className="absolute top-3 right-3 z-10"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-neutral-900/70 rounded-xl shadow-lg p-2 border border-neutral-800 overflow-hidden">
        {nodes.length > 0 ? (
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

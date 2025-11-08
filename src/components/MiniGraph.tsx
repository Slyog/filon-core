"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ReactFlowProvider,
  ReactFlow,
  Background,
  type Node as FlowNode,
  type Edge as FlowEdge,
} from "reactflow";
import { motion, useReducedMotion } from "framer-motion";
import "reactflow/dist/style.css";
import { useThrottledCallback } from "@/hooks/useThrottledCallback";
import { t } from "@/config/strings";
import {
  GraphDefaults,
  radialPlacement,
  truncateLabel,
} from "@/components/graph/GraphDefaults";

type MiniGraphNode = { id: string; label: string };
type MiniGraphEdge = { id: string; source: string; target: string };

interface MiniGraphProps {
  nodes: MiniGraphNode[];
  edges: MiniGraphEdge[];
  onHoverNode?: (id: string | null) => void;
  onNodeClick?: (id: string) => void;
}

const useIsCompact = () => {
  const [isCompact, setIsCompact] = useState(false);
  useEffect(() => {
    const evaluate = () => setIsCompact(window.innerWidth < 520);
    evaluate();
    window.addEventListener("resize", evaluate);
    return () => window.removeEventListener("resize", evaluate);
  }, []);
  return isCompact;
};

const useIsVisible = (ref: React.RefObject<HTMLDivElement>) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting)
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return visible;
};

const formatNodes = (nodes: MiniGraphNode[]): MiniGraphNode[] =>
  nodes.slice(-5).map((node) => ({
    ...node,
    label: truncateLabel(node.label, "mini"),
  }));

const layoutNodes = (nodes: MiniGraphNode[]): FlowNode[] => {
  if (nodes.length === 0) return [];
  return nodes.map((node, index) => {
    const base = radialPlacement({ x: 0, y: 0 }, index, nodes.length);
    const scale = 0.35;
    const x = base.x * scale;
    const y = base.y * scale;
    // Ensure position values are valid numbers
    const safeX = Number.isFinite(x) ? x : 0;
    const safeY = Number.isFinite(y) ? y : 0;
    return {
      id: node.id,
      data: { label: node.label },
      position: { x: safeX, y: safeY },
      type: "default",
    } satisfies FlowNode;
  });
};

const filterEdges = (
  nodes: FlowNode[],
  edges: MiniGraphEdge[]
): FlowEdge[] => {
  const ids = new Set(nodes.map((node) => node.id));
  return edges
    .filter((edge) => ids.has(edge.source) && ids.has(edge.target))
    .map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: true,
      animated: false,
      style: {
        stroke: GraphDefaults.colorTokens.edge,
        strokeWidth: GraphDefaults.edgeStyle.width,
        opacity: GraphDefaults.edgeStyle.opacity,
      },
    }));
};

export default function MiniGraph({
  nodes,
  edges,
  onHoverNode,
  onNodeClick,
}: MiniGraphProps) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);
  const [focusWithin, setFocusWithin] = useState(false);
  const compact = useIsCompact();
  const hostRef = useRef<HTMLDivElement>(null);
  const visible = useIsVisible(hostRef);
  const describeMiniGraph = t.miniGraphDescription;

  const recentNodes = useMemo(() => formatNodes(nodes), [nodes]);
  const flowNodes = useMemo(() => layoutNodes(recentNodes), [recentNodes]);
  const flowEdges = useMemo(
    () => filterEdges(flowNodes, edges),
    [flowNodes, edges]
  );

  const emitHover = useThrottledCallback((id: string | null) => {
    onHoverNode?.(id);
  });

  const handleMouseEnter = useCallback(
    (_event: React.MouseEvent, node: FlowNode) => {
      setHovered(node.id);
      emitHover(node.id);
    },
    [emitHover]
  );

  const handleMouseLeave = useCallback(() => {
    setHovered(null);
    emitHover(null);
  }, [emitHover]);

  if (compact) {
    return (
      <motion.div
        data-tour-id="tour-minigraph"
        role="img"
        aria-label="Mini-Graph"
        aria-description={describeMiniGraph}
        tabIndex={0}
        data-testid="mini-graph"
        className="focus-glow relative flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 text-cyan-100 focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
        data-focused={hovered !== null || focusWithin}
        whileHover={reduced ? undefined : { scale: 1.05 }}
        whileTap={reduced ? undefined : { scale: 0.95 }}
        transition={{ type: "spring", stiffness: 120, damping: 22 }}
        onMouseEnter={() => emitHover(null)}
        onMouseLeave={() => emitHover(null)}
        onFocus={() => setFocusWithin(true)}
        onBlur={() => setFocusWithin(false)}
      >
        <span className="text-lg font-semibold">
          {recentNodes.length || nodes.length}
        </span>
        <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-surface-base">
          {recentNodes.length}
        </span>
      </motion.div>
    );
  }

  if (recentNodes.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-cyan-400/30 text-sm text-text-secondary/70">
        {t.noThoughtsInGraph}
      </div>
    );
  }

  return (
    <div
      data-tour-id="tour-minigraph"
      ref={hostRef}
      className="focus-glow relative h-48 w-full overflow-hidden rounded-2xl border border-cyan-400/20 bg-surface-active/30 focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
      data-focused={hovered !== null || focusWithin}
      role="img"
      aria-label="Mini-Graph"
      aria-description={describeMiniGraph}
      tabIndex={0}
      data-testid="mini-graph"
      onFocus={() => setFocusWithin(true)}
      onBlur={() => setFocusWithin(false)}
    >
      {visible ? (
        <ReactFlowProvider>
          <ReactFlow
            nodes={flowNodes.map((node) => ({
              ...node,
              style: {
                padding: 8,
                borderRadius: 999,
                border:
                  hovered === node.id
                    ? `2px solid ${GraphDefaults.colorTokens.focus}`
                    : `1px solid ${GraphDefaults.colorTokens.edge}`,
                color: "#E6FDFE",
                background: "rgba(5, 20, 29, 0.92)",
                fontSize: 12,
                fontWeight: 400,
                letterSpacing: "0.04em",
                boxShadow:
                  hovered === node.id
                    ? `0 0 12px ${GraphDefaults.colorTokens.edge}`
                    : "none",
                transition: "all 0.12s ease",
              },
            }))}
            edges={flowEdges}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={false}
            zoomOnPinch={false}
            zoomOnScroll={false}
            defaultViewport={{ 
              x: 0, 
              y: 0, 
              zoom: Number.isFinite(GraphDefaults.zoomStart) ? GraphDefaults.zoomStart : 0.9 
            }}
            minZoom={0.6}
            maxZoom={1.4}
            fitView
            fitViewOptions={{ padding: 0.1, maxZoom: 1.4 }}
            onNodeMouseEnter={handleMouseEnter}
            onNodeMouseLeave={handleMouseLeave}
            onNodeClick={(_event, node) => onNodeClick?.(node.id)}
          >
            <Background gap={18} color="rgba(56,189,248,0.08)" />
          </ReactFlow>
        </ReactFlowProvider>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-text-secondary/70">
          {t.previewPaused}
        </div>
      )}
    </div>
  );
}

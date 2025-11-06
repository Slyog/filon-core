"use client";

import React, {
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion, useAnimation } from "framer-motion";
import { useReactFlow } from "reactflow";
import { ZoomIn, ZoomOut } from "lucide-react";
import type { Node, Edge, XYPosition } from "reactflow";
import { getNodeClusters } from "@/lib/clusterUtils";
import { useUIStore } from "@/store/UIStore";
import { useActiveNode } from "@/context/ActiveNodeContext";

interface GraphMiniMapProps {
  nodes?: Node[];
  edges?: Edge[];
  nodeColor?: (node: Node) => string;
  maskColor?: string;
}

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 150;
const NODE_SIZE = 4;
const CLUSTER_THRESHOLD = 5;
const CLUSTER_RADIUS = 20;
const PADDING = 20;

export default function GraphMiniMap({
  nodes = [],
  edges = [],
  nodeColor,
  maskColor = "rgba(0, 0, 0, 0.6)",
}: GraphMiniMapProps) {
  const { getViewport, setViewport } = useReactFlow();
  const { activeNodeId } = useActiveNode();
  const reduced = useReducedMotion();
  const isInternalUpdateRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverPosition, setHoverPosition] = useState<XYPosition | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const pulseControls = useAnimation();

  // 🔄 Subscribe to viewport changes from UIStore
  useEffect(() => {
    const unsubscribe = useUIStore.getState().subscribeMiniMap((viewport) => {
      if (!viewport) return;

      const currentViewport = getViewport();
      const hasChanged =
        Math.abs(currentViewport.x - viewport.x) > 0.1 ||
        Math.abs(currentViewport.y - viewport.y) > 0.1 ||
        Math.abs(currentViewport.zoom - viewport.zoom) > 0.01;

      if (hasChanged && !isInternalUpdateRef.current) {
        isInternalUpdateRef.current = true;
        setViewport(
          {
            x: viewport.x,
            y: viewport.y,
            zoom: viewport.zoom,
          },
          { duration: reduced ? 0 : 0 }
        );
        requestAnimationFrame(() => {
          isInternalUpdateRef.current = false;
        });
      }
    });

    return unsubscribe;
  }, [getViewport, setViewport, reduced]);

  const viewport = getViewport();

  // Memoize cluster calculation
  const clusters = useMemo(() => {
    return getNodeClusters(nodes, 250);
  }, [nodes.length, viewport]);

  // Calculate bounds for coordinate transformation
  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return {
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100,
        width: 100,
        height: 100,
      };
    }
    const positions = nodes.map((n) => n.position);
    const widths = nodes.map((n) => n.width || 150);
    const heights = nodes.map((n) => n.height || 40);
    const minX = Math.min(...positions.map((p, i) => p.x));
    const maxX = Math.max(...positions.map((p, i) => p.x + widths[i]));
    const minY = Math.min(...positions.map((p, i) => p.y));
    const maxY = Math.max(...positions.map((p, i) => p.y + heights[i]));
    const width = maxX - minX || 100;
    const height = maxY - minY || 100;
    return { minX, maxX, minY, maxY, width, height };
  }, [nodes]);

  // Calculate scale to fit all nodes in minimap
  const scale = useMemo(() => {
    const scaleX = (MINIMAP_WIDTH - PADDING * 2) / bounds.width;
    const scaleY = (MINIMAP_HEIGHT - PADDING * 2) / bounds.height;
    return Math.min(scaleX, scaleY, 1);
  }, [bounds]);

  // Convert flow position to minimap canvas position
  const flowToMiniMap = useCallback(
    (flowPos: XYPosition): XYPosition => {
      const x = (flowPos.x - bounds.minX) * scale + PADDING;
      const y = (flowPos.y - bounds.minY) * scale + PADDING;
      return { x, y };
    },
    [bounds, scale]
  );

  // Convert minimap canvas position to flow position
  const miniMapToFlow = useCallback(
    (miniMapPos: XYPosition): XYPosition => {
      const x = (miniMapPos.x - PADDING) / scale + bounds.minX;
      const y = (miniMapPos.y - PADDING) / scale + bounds.minY;
      return { x, y };
    },
    [bounds, scale]
  );

  const defaultNodeColor = (node: Node) => {
    return node.selected ? "#06b6d4" : "#3b82f6";
  };

  // Draw minimap on canvas
  const drawMiniMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Draw background
    ctx.fillStyle = "rgba(17, 24, 39, 0.8)";
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Draw cluster glows (blurred color blobs for >5 nodes)
    clusters
      .filter((cluster) => cluster.count > CLUSTER_THRESHOLD)
      .forEach((cluster) => {
        const minimapPos = flowToMiniMap({ x: cluster.x, y: cluster.y });
        const radius = Math.min(cluster.count * 2, CLUSTER_RADIUS);

        // Create radial gradient for glow effect
        const gradient = ctx.createRadialGradient(
          minimapPos.x,
          minimapPos.y,
          0,
          minimapPos.x,
          minimapPos.y,
          radius
        );
        const opacity = Math.min(cluster.count / 10, 0.5);
        gradient.addColorStop(0, `rgba(59, 130, 246, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(59, 130, 246, ${opacity * 0.5})`);
        gradient.addColorStop(1, "rgba(59, 130, 246, 0)");

        // Draw blurred glow (simulated with multiple circles)
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(minimapPos.x, minimapPos.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

    // Draw edges
    ctx.strokeStyle = "rgba(107, 114, 128, 0.3)";
    ctx.lineWidth = 1;
    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (sourceNode && targetNode) {
        const sourcePos = flowToMiniMap(sourceNode.position);
        const targetPos = flowToMiniMap(targetNode.position);
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      const miniMapPos = flowToMiniMap(node.position);
      const color = nodeColor ? nodeColor(node) : defaultNodeColor(node);
      const isActive = node.id === activeNodeId;

      // Draw node
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(miniMapPos.x, miniMapPos.y, NODE_SIZE, 0, Math.PI * 2);
      ctx.fill();

      // Draw active node highlight (static, animation handled separately)
      if (isActive) {
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(miniMapPos.x, miniMapPos.y, NODE_SIZE + 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Draw viewport mask
    // Calculate viewport bounds in flow space
    // ReactFlow viewport: x and y are translation offsets
    // Visible area in flow space: center point is at (-x/zoom, -y/zoom)
    const reactFlowContainer =
      (document.querySelector(".react-flow__viewport") as HTMLElement) ||
      (document.querySelector(".react-flow") as HTMLElement);
    if (reactFlowContainer) {
      const containerWidth = reactFlowContainer.clientWidth || 800;
      const containerHeight = reactFlowContainer.clientHeight || 600;

      // Calculate visible area in flow coordinates
      // Top-left corner in flow space
      const viewportX = (-viewport.x + containerWidth / 2) / viewport.zoom;
      const viewportY = (-viewport.y + containerHeight / 2) / viewport.zoom;
      const viewportWidth = containerWidth / viewport.zoom;
      const viewportHeight = containerHeight / viewport.zoom;

      // Convert to minimap coordinates
      const maskX = (viewportX - bounds.minX) * scale + PADDING;
      const maskY = (viewportY - bounds.minY) * scale + PADDING;
      const maskW = viewportWidth * scale;
      const maskH = viewportHeight * scale;

      // Draw viewport rectangle border
      ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
      ctx.lineWidth = 2;
      ctx.strokeRect(maskX, maskY, maskW, maskH);

      // Draw mask overlay (darken areas outside viewport)
      ctx.fillStyle = maskColor;
      ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);
      ctx.clearRect(maskX, maskY, maskW, maskH);
    }

    // Draw hover locator dot (cyan)
    if (isHovering && hoverPosition) {
      ctx.fillStyle = "#06b6d4";
      ctx.beginPath();
      ctx.arc(hoverPosition.x, hoverPosition.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [
    nodes,
    edges,
    bounds,
    scale,
    flowToMiniMap,
    viewport,
    maskColor,
    nodeColor,
    activeNodeId,
    clusters,
    isHovering,
    hoverPosition,
  ]);

  // Animate active node pulse
  useEffect(() => {
    if (activeNodeId && !reduced) {
      pulseControls.start({
        scale: [1, 1.3, 1],
        opacity: [1, 0.7, 1],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      });
    } else {
      pulseControls.stop();
    }
  }, [activeNodeId, reduced, pulseControls]);

  // Redraw on changes
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      drawMiniMap();
    });
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawMiniMap]);

  // Handle mouse move (hover-to-locate)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setHoverPosition({ x, y });
      setIsHovering(true);
    },
    []
  );

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setHoverPosition(null);
  }, []);

  // Handle click (click-to-center)
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const flowPos = miniMapToFlow({ x, y });
      const reactFlowContainer =
        (document.querySelector(".react-flow__viewport") as HTMLElement) ||
        (document.querySelector(".react-flow") as HTMLElement);
      if (!reactFlowContainer) return;

      const containerWidth = reactFlowContainer.clientWidth || 800;
      const containerHeight = reactFlowContainer.clientHeight || 600;

      // Center viewport on clicked position
      // ReactFlow viewport: to center a point, set x = -pointX * zoom + containerWidth/2
      const duration = reduced ? 0 : 300;
      isInternalUpdateRef.current = true;
      const newViewport = {
        x: -flowPos.x * viewport.zoom + containerWidth / 2,
        y: -flowPos.y * viewport.zoom + containerHeight / 2,
        zoom: viewport.zoom,
      };
      setViewport(newViewport, { duration });
      // Broadcast to UIStore
      useUIStore.getState().setViewportState(newViewport);
      requestAnimationFrame(() => {
        isInternalUpdateRef.current = false;
      });
    },
    [miniMapToFlow, viewport, setViewport, reduced]
  );

  // Pan viewport in small increments
  const nudge = useCallback(
    (dx: number, dy: number) => {
      const viewport = getViewport();
      const duration = reduced ? 0 : 150;
      isInternalUpdateRef.current = true;
      setViewport(
        {
          x: viewport.x + dx,
          y: viewport.y + dy,
          zoom: viewport.zoom,
        },
        { duration }
      );
      useUIStore.getState().setViewportState({
        x: viewport.x + dx,
        y: viewport.y + dy,
        zoom: viewport.zoom,
      });
      requestAnimationFrame(() => {
        isInternalUpdateRef.current = false;
      });
    },
    [getViewport, setViewport, reduced]
  );

  // Zoom in/out
  const handleZoom = useCallback(
    (delta: number) => {
      const viewport = getViewport();
      const newZoom = Math.max(0.1, Math.min(2, viewport.zoom + delta));
      const duration = reduced ? 0 : 150;
      isInternalUpdateRef.current = true;
      setViewport(
        {
          x: viewport.x,
          y: viewport.y,
          zoom: newZoom,
        },
        { duration }
      );
      useUIStore.getState().setViewportState({
        x: viewport.x,
        y: viewport.y,
        zoom: newZoom,
      });
      requestAnimationFrame(() => {
        isInternalUpdateRef.current = false;
      });
    },
    [getViewport, setViewport, reduced]
  );

  // Keyboard controls for viewport navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          (activeElement.isContentEditable ?? false))
      ) {
        return;
      }

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
      } else if (e.key === "+" || e.key === "=") {
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

  // Get active node position for pulse overlay
  const activeNodePosition = useMemo(() => {
    if (!activeNodeId) return null;
    const node = nodes.find((n) => n.id === activeNodeId);
    if (!node) return null;
    return flowToMiniMap(node.position);
  }, [activeNodeId, nodes, flowToMiniMap]);

  return (
    <motion.div
      className="absolute top-3 right-3 z-10"
      initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduced ? { duration: 0 } : { duration: 0.5 }}
      aria-description="Interactive overview of the graph canvas"
    >
      <div className="bg-neutral-900/70 rounded-xl shadow-lg p-2 border border-neutral-800 overflow-hidden">
        {nodes.length > 0 ? (
          <>
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={MINIMAP_WIDTH}
                height={MINIMAP_HEIGHT}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                className="cursor-pointer"
                style={{
                  backgroundColor: "rgba(17, 24, 39, 0.8)",
                  borderRadius: "8px",
                }}
                aria-label="Interactive minimap - click to center viewport, hover to locate"
              />
              {/* Active node pulse overlay */}
              {activeNodeId && activeNodePosition && (
                <motion.div
                  className="absolute pointer-events-none"
                  style={{
                    left: activeNodePosition.x - NODE_SIZE - 4,
                    top: activeNodePosition.y - NODE_SIZE - 4,
                    width: (NODE_SIZE + 4) * 2,
                    height: (NODE_SIZE + 4) * 2,
                    borderRadius: "50%",
                    border: "2px solid #06b6d4",
                    boxShadow: reduced
                      ? "0 0 5px rgba(6, 182, 212, 0.5)"
                      : "0 0 15px rgba(6, 182, 212, 0.8)",
                  }}
                  animate={pulseControls}
                />
              )}
            </div>
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
          </div>
        )}
      </div>
    </motion.div>
  );
}

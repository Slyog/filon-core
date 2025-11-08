import type { XYPosition } from "reactflow";

const TWO_PI = Math.PI * 2;
const RADIUS_MIN = 220;
const RADIUS_MAX = 280;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const lerp = (start: number, end: number, t: number) =>
  start + (end - start) * t;

const colorHex = {
  cyan400: "#22d3ee",
  cyan300: "#67e8f9",
  cyan200: "#a5f3fc",
};

export const GraphDefaults = {
  zoomStart: 0.9,
  edgeStyle: {
    opacity: 0.6,
    width: 1,
    noArrowsByDefault: true,
  },
  labelPolicy: {
    mini: 26,
    main: 40,
  },
  neighborReveal: 1,
  colorTokens: {
    focus: colorHex.cyan400,
    muted: "rgba(165, 243, 252, 0.4)",
    edge: "rgba(103, 232, 249, 0.6)",
  },
} as const;

export type GraphLabelVariant = "mini" | "main";

export const truncateLabel = (
  label: string,
  variant: GraphLabelVariant,
  isActive = false
) => {
  if (isActive) return label;
  const limit = GraphDefaults.labelPolicy[variant];
  if (!limit || label.length <= limit) return label;
  return `${label.slice(0, clamp(limit - 1, 0, limit))}…`;
};

export const radialPlacement = (
  center: XYPosition,
  index: number,
  total = 12
): XYPosition => {
  const spread = Math.max(total, 6);
  const goldenAngle = 0.61803398875;
  const rotation = (index * goldenAngle) % 1;
  const angle = rotation * TWO_PI;
  const radiusStep = (index % spread) / spread;
  const baseRadius = lerp(RADIUS_MIN, RADIUS_MAX, radiusStep);
  const jitter = Math.sin(index * 1.47) * 12;
  const radius = clamp(baseRadius + jitter, RADIUS_MIN, RADIUS_MAX);

  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
};


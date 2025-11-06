/**
 * FILON Design Tokens
 * Maps Figma tokens to Tailwind CSS variables and utility classes
 * Synchronized with tailwind.config.ts
 */

import figmaTokens from "./figmaTokens.json";

// Extract token values from Figma JSON
const extractColorValue = (token: any): string => {
  if (typeof token === "string") return token;
  if (token?.value) return token.value;
  return token;
};

const extractSpacingValue = (token: any): string => {
  if (typeof token === "string") return token;
  if (token?.value) return token.value;
  return token;
};

const extractRadiusValue = (token: any): string => {
  if (typeof token === "string") return token;
  if (token?.value) return token.value;
  return token;
};

/**
 * FILON Design Tokens mapped to Tailwind CSS variables
 * These tokens sync with CSS variables defined in filon-theme.css
 */
export const filonTokens = {
  colors: {
    // Primary colors mapped to CSS variables
    primary: "hsl(var(--filon-primary))",
    accent: "hsl(var(--filon-accent))",
    background: "hsl(var(--filon-bg))",
    surface: "hsl(var(--filon-surface))",
    glow: "rgba(47, 243, 255, 0.8)", // Direct RGBA for glow effects
    text: {
      primary: extractColorValue(figmaTokens.colors.text.primary),
      secondary: extractColorValue(figmaTokens.colors.text.secondary),
      muted: extractColorValue(figmaTokens.colors.text.muted),
    },
    // Brand colors
    brand: {
      DEFAULT: extractColorValue(figmaTokens.colors.brand.DEFAULT),
      soft: extractColorValue(figmaTokens.colors.brand.soft),
      dark: extractColorValue(figmaTokens.colors.brand.dark),
    },
    // Accent variants
    accentVariants: {
      glow: extractColorValue(figmaTokens.colors.accent.glow),
      warning: extractColorValue(figmaTokens.colors.accent.warning),
      error: extractColorValue(figmaTokens.colors.accent.error),
    },
    // Surface variants
    surfaceVariants: {
      base: extractColorValue(figmaTokens.colors.surface.base),
      hover: extractColorValue(figmaTokens.colors.surface.hover),
      active: extractColorValue(figmaTokens.colors.surface.active),
    },
  },
  radius: {
    sm: extractRadiusValue(figmaTokens.radius.sm),
    xl: extractRadiusValue(figmaTokens.radius.xl),
    "2xl": extractRadiusValue(figmaTokens.radius["2xl"]),
  },
  spacing: {
    xs: extractSpacingValue(figmaTokens.spacing.xs),
    sm: extractSpacingValue(figmaTokens.spacing.sm),
    base: extractSpacingValue(figmaTokens.spacing.base),
    md: extractSpacingValue(figmaTokens.spacing.md),
    lg: extractSpacingValue(figmaTokens.spacing.lg),
    xl: extractSpacingValue(figmaTokens.spacing.xl),
  },
  typography: {
    fontFamily: {
      sans: figmaTokens.typography.fontFamily.sans.value,
      mono: figmaTokens.typography.fontFamily.mono.value,
    },
    fontWeight: {
      normal: figmaTokens.typography.fontWeight.normal.value,
      medium: figmaTokens.typography.fontWeight.medium.value,
      semibold: figmaTokens.typography.fontWeight.semibold.value,
      bold: figmaTokens.typography.fontWeight.bold.value,
    },
    fontSize: {
      xs: figmaTokens.typography.fontSize.xs.value,
      sm: figmaTokens.typography.fontSize.sm.value,
      base: figmaTokens.typography.fontSize.base.value,
      lg: figmaTokens.typography.fontSize.lg.value,
      xl: figmaTokens.typography.fontSize.xl.value,
      "2xl": figmaTokens.typography.fontSize["2xl"].value,
    },
  },
  motion: {
    duration: {
      fast: figmaTokens.motion.duration.fast.value,
      medium: figmaTokens.motion.duration.medium.value,
      slow: figmaTokens.motion.duration.slow.value,
    },
    easing: {
      // Framer Motion requires arrays, not strings
      default: [0.25, 0.1, 0.25, 1], // cubic-bezier(0.25, 0.1, 0.25, 1)
      smooth: [0.2, 0.8, 0.2, 1], // cubic-bezier(0.2, 0.8, 0.2, 1)
    },
    // String versions for CSS usage
    easingString: {
      default: figmaTokens.motion.easing.default.value,
      smooth: figmaTokens.motion.easing.smooth.value,
    },
  },
  shadows: {
    glow: figmaTokens.shadows.glow.value,
    "glow-md": figmaTokens.shadows["glow-md"].value,
    inner: figmaTokens.shadows.inner.value,
  },
  depth: {
    surface: "0 0 8px hsl(var(--filon-glow)/0.15)",
    raised: "0 0 16px hsl(var(--filon-glow)/0.25)",
    overlay: "0 0 24px hsl(var(--filon-accent)/0.35)",
  },
  motionPresets: {
    softPulse: { scale: [1, 1.02, 1], opacity: [0.95, 1, 0.95] },
    fadeShift: { y: [10, 0], opacity: [0, 1] },
    parallax: { y: [-4, 4], transition: { repeat: Infinity, repeatType: "reverse" as const, duration: 6 } },
  },
  glowLevels: {
    low: "0 0 8px hsl(var(--filon-glow)/0.2)",
    mid: "0 0 16px hsl(var(--filon-glow)/0.35)",
    high: "0 0 24px hsl(var(--filon-accent)/0.55)",
  },
  zIndex: { base: 0, raised: 5, overlay: 10, focus: 20 },
} as const;

/**
 * Helper function to convert hex to HSL for CSS variables
 * Used when CSS variables need HSL format
 */
export const hexToHsl = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number, l: number;

  l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
      default:
        h = 0;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

/**
 * Export component variants from Figma tokens
 */
export const componentVariants = {
  Button: figmaTokens.components.Button,
  Card: figmaTokens.components.Card,
  Panel: figmaTokens.components.Panel,
  Modal: figmaTokens.components.Modal,
} as const;

export type FilonTokenColors = typeof filonTokens.colors;
export type FilonTokenSpacing = typeof filonTokens.spacing;
export type FilonTokenRadius = typeof filonTokens.radius;


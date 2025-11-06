import type { Config } from "tailwindcss";
import { filonTokens } from "./src/design/filonTokens";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Legacy Noion colors for backward compatibility
        "noion-dark": "#0e0f12",
        "noion-light": "#fafafa",
        "noion-accent": "#00c2ff",
        "noion-glow": "#38bdf8",
        "noion-muted": "#1a1b1e",
        // FILON Design Tokens - Synchronized from filonTokens
        // Direct color mappings for backward compatibility
        background: filonTokens.colors.background,
        surface: filonTokens.colors.surface,
        glow: filonTokens.colors.glow,
        accent: filonTokens.colors.accent,
        text: filonTokens.colors.text.primary,
        // Phase 2: Design Tokens (backward compatibility)
        filament: filonTokens.colors.brand.DEFAULT,
        base: filonTokens.colors.surfaceVariants.base,
        layer: "#101418",
        panel: "#1C2229",
        filon: {
          bg: "var(--filon-bg)",
          surface: "var(--filon-surface)",
          glow: "var(--filon-glow)",
          accent: "var(--filon-accent)",
          text: "var(--filon-text)",
        },
        // FILON Step 16.9 - Unified Design Tokens (synced from filonTokens)
        brand: filonTokens.colors.brand,
        surface: {
          base: filonTokens.colors.surfaceVariants.base,
          hover: filonTokens.colors.surfaceVariants.hover,
          active: filonTokens.colors.surfaceVariants.active,
        },
        accent: {
          glow: filonTokens.colors.accentVariants.glow,
          warning: filonTokens.colors.accentVariants.warning,
          error: filonTokens.colors.accentVariants.error,
        },
        text: filonTokens.colors.text,
      },
      fontFamily: filonTokens.typography.fontFamily,
      boxShadow: {
        ...filonTokens.shadows,
        glow: "0 0 12px 0 hsl(var(--filon-glow)/0.5)",
      },
      transitionDuration: filonTokens.motion.duration,
      spacing: filonTokens.spacing,
      borderRadius: filonTokens.radius,
      transitionTimingFunction: {
        filon: filonTokens.motion.easingString.smooth,
        out: filonTokens.motion.easingString.default,
        smooth: filonTokens.motion.easingString.smooth,
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        glowPulse: {
          "0%,100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-out",
        glowPulse: "glowPulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [
    // Note: Install @tailwindcss/forms, @tailwindcss/typography, and @tailwindcss/container-queries if needed
    // require("@tailwindcss/forms"),
    // require("@tailwindcss/typography"),
    // require("@tailwindcss/container-queries"),
  ],
};

export default config;

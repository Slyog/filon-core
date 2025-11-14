import type { Config } from "tailwindcss";
import { filonTokens } from "./src/design/filonTokens";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{ts,tsx}", // ShadCN components
  ],
  theme: {
    extend: {
      colors: {
        // FILON legacy palette aliases
        "filon-dark": "#0e0f12",
        "filon-light": "#fafafa",
        "filon-accent": "#00c2ff",
        "filon-glow": "#38bdf8",
        "filon-muted": "#1a1b1e",
        // FILON Design Tokens - Synchronized from filonTokens
        // Direct color mappings for backward compatibility
        background: filonTokens.colors.background,
        glow: filonTokens.colors.glow,
        // Phase 2: Design Tokens (backward compatibility)
        filament: filonTokens.colors.brand.DEFAULT,
        base: filonTokens.colors.surfaceVariants.base,
        layer: "#101418",
        panel: "#1C2229",
        filon: {
          bg: "var(--filon-bg)",
          surface: "var(--filon-surface)",
          text: "var(--filon-text)",
          accent: "var(--filon-accent)",
          border: "var(--filon-border)",
          glow: "var(--filon-glow)",
        },
        // FILON Step 16.9 - Unified Design Tokens (synced from filonTokens)
        brand: filonTokens.colors.brand,
        surface: {
          DEFAULT: filonTokens.colors.surface,
          base: filonTokens.colors.surfaceVariants.base,
          hover: filonTokens.colors.surfaceVariants.hover,
          active: filonTokens.colors.surfaceVariants.active,
        },
        accent: {
          DEFAULT: filonTokens.colors.accent,
          glow: filonTokens.colors.accentVariants.glow,
          warning: filonTokens.colors.accentVariants.warning,
          error: filonTokens.colors.accentVariants.error,
        },
        text: filonTokens.colors.text,
      },
      fontFamily: filonTokens.typography.fontFamily,
      boxShadow: {
        ...filonTokens.shadows,
        glow: "0 0 10px rgba(47, 243, 255, 0.4)",
        "glow-strong": "0 0 25px rgba(47, 243, 255, 0.6)",
        surface: "0 0 8px 0 hsl(var(--filon-glow-hsl, 180 100% 60%)/0.15)",
        raised: "0 0 16px 0 hsl(var(--filon-glow-hsl, 180 100% 60%)/0.25)",
        overlay: "0 0 24px 0 hsl(var(--filon-accent-hsl, 180 100% 60%)/0.35)",
        "glow-low": filonTokens.glowLevels.low,
        "glow-mid": filonTokens.glowLevels.mid,
        "glow-high": filonTokens.glowLevels.high,
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
      },
      transitionDuration: filonTokens.motion.duration,
      spacing: filonTokens.spacing,
      borderRadius: {
        ...filonTokens.radius,
        filon: "0.75rem",
      },
      zIndex: filonTokens.zIndex,
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
    require("tailwindcss-animate"),
    // Note: Install @tailwindcss/forms, @tailwindcss/typography, and @tailwindcss/container-queries if needed
    // require("@tailwindcss/forms"),
    // require("@tailwindcss/typography"),
    // require("@tailwindcss/container-queries"),
  ],
};

export default config;

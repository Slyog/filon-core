import type { Config } from "tailwindcss";

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
        // New FILON Design System colors
        background: "#0A0F12",
        surface: "#12181C",
        glow: "#2FF3FF",
        accent: "#00C2D1",
        text: "#E6E6E6",
        // Phase 2: Design Tokens
        filament: "#2FF3FF",
        base: "#0A0F12",
        layer: "#101418",
        panel: "#1C2229",
        filon: {
          bg: "var(--filon-bg)",
          surface: "var(--filon-surface)",
          glow: "var(--filon-glow)",
          accent: "var(--filon-accent)",
          text: "var(--filon-text)",
        },
        // FILON Step 16.9 - Unified Design Tokens
        brand: {
          DEFAULT: "#2FF3FF",
          soft: "#A8FFF9",
          dark: "#0B3A45",
        },
        surface: {
          base: "#0B0C10",
          hover: "#111218",
          active: "#181A22",
        },
        accent: {
          glow: "#39E5FF",
          warning: "#FFC857",
          error: "#FF5964",
        },
        text: {
          primary: "#E6E6E6",
          secondary: "#9CA3AF",
          muted: "#6B7280",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 12px 2px rgba(47,243,255,0.4)",
        inner: "inset 0 0 8px rgba(47,243,255,0.15)",
        "glow-md": "0 0 20px rgba(47,243,255,0.5)",
      },
      transitionDuration: {
        fast: "150ms",
        medium: "300ms",
        slow: "600ms",
      },
      spacing: {
        xs: "0.5rem",
        sm: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "3rem",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.25,0.1,0.25,1)",
        smooth: "cubic-bezier(0.2, 0.8, 0.2, 1)",
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

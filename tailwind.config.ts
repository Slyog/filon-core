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
        filon: {
          bg: "var(--filon-bg)",
          surface: "var(--filon-surface)",
          glow: "var(--filon-glow)",
          accent: "var(--filon-accent)",
          text: "var(--filon-text)",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        glow: "var(--filon-glow-shadow)",
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
    },
  },
  plugins: [],
};

export default config;

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
        fast: "400ms",
        medium: "1200ms",
        slow: "2400ms",
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

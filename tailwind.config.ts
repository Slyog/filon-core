import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "noion-dark": "#0e0f12",
        "noion-light": "#fafafa",
        "noion-accent": "#00c2ff",
        "noion-glow": "#38bdf8",
        "noion-muted": "#1a1b1e",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
import type { Config } from "jest";

const config: Config = {
  // --- Basis --------------------------------------------------------------
  preset: "ts-jest",
  testEnvironment: "jsdom",
  clearMocks: true,

  // --- Dateitypen ---------------------------------------------------------
  transform: {
    "^.+\\.(t|j)sx?$": "ts-jest",
  },

  // --- Alias-Resolver (Next/TS kompatibel) -------------------------------
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // Statische Assets stubben
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
  },

  // --- Test-Suche ---------------------------------------------------------
  testMatch: ["**/__tests__/**/*.(test|spec).(ts|tsx)"],

  // --- Setup-Dateien ------------------------------------------------------
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // --- Abdeckungs-Ordner (optional) --------------------------------------
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/**/types.ts",
  ],

  // --- Performance --------------------------------------------------------
  maxWorkers: "50%",

  // --- Transform ESM modules ----------------------------------------------
  transformIgnorePatterns: [
    "node_modules/(?!(react-markdown|remark-gfm|unified|unist-util-.*|vfile|vfile-message|micromark|micromark-.*|decode-named-character-reference|character-entities|mdast-.*|unist-util-.*|bail|is-plain-obj|trough|remark-.*|rehype-.*|hast-.*|property-information|space-separated-tokens|comma-separated-tokens|html-void-elements|zwitch|longest-streak|ccount|escape-string-regexp)/)",
  ],
};

export default config;

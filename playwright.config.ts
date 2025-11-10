import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/qa",
  retries: 1,
  reporter: [["list"], ["html", { outputFolder: "qa/reports/html" }]],
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
});

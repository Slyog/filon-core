import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/qa",
  testIgnore: ["**/legacy/**"],
  retries: 1,
  timeout: 20000, // 20s global timeout
  reporter: [["list"], ["html", { outputFolder: "qa/reports/html" }]],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
});

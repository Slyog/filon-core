import { test as base, expect } from "@playwright/test";

const test = base;

export { test, expect };

test.describe("FILON Toolchain Retry Logic", () => {
  test.describe.configure({ retries: 1 });
  test("retries on temporary failure", async ({ page }) => {
    await page.goto("http://localhost:3000");

    await page.waitForLoadState("networkidle", { timeout: 20_000 });
    await page.waitForSelector("#brainbar-input", { timeout: 15_000 });

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("filon:simulate-failure", { detail: "createNode" })
      );
    });

    const logs: string[] = [];
    page.on("console", (msg) => logs.push(msg.text()));

    await page.getByRole("button", { name: /AI Summarize & Link/i }).click({ timeout: 10_000 });
    await page.waitForSelector('[data-id^="filon-node-"]', { timeout: 20_000 });

    const retryLog = logs.find((l) =>
      l.includes("[FILON Retry] createNode succeeded")
    );
    expect(retryLog).toBeTruthy();

    console.log("✅ Retry system handled simulated failure successfully.");
  });
});

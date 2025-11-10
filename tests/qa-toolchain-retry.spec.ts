import { test, expect } from "@playwright/test";

test.describe("FILON Toolchain Retry Logic", () => {
  test("retries on temporary failure", async ({ page }) => {
    await page.goto("http://localhost:3000");

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("filon:simulate-failure", { detail: "createNode" })
      );
    });

    const logs: string[] = [];
    page.on("console", (msg) => logs.push(msg.text()));

    await page.getByRole("button", { name: /AI Summarize & Link/i }).click();
    await page.waitForSelector('[data-id^="filon-node-"]', { timeout: 8000 });

    const retryLog = logs.find((l) =>
      l.includes("[FILON Retry] createNode succeeded")
    );
    expect(retryLog).toBeTruthy();

    console.log("✅ Retry system handled simulated failure successfully.");
  });
});

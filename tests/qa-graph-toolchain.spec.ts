import { test as base, expect } from "@playwright/test";

const test = base;

export { test, expect };

test.describe("FILON Graph Toolchain Minimal", () => {
  test.describe.configure({ retries: 1 });
  test("runs summarize → createNode → linkNodes sequence", async ({ page }) => {
    await page.goto("http://localhost:3000");

    await page.waitForLoadState("networkidle", { timeout: 20_000 });
    await page.waitForSelector("#brainbar-input", { timeout: 15_000 });

    const logs: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("[FILON AI]")) {
        logs.push(text);
      }
    });

    await page.getByRole("button", { name: /AI Summarize & Link/i }).click({ timeout: 10_000 });

    await page.waitForSelector('[data-id^="filon-node-"]', { timeout: 20_000 });

    expect(logs.some((l) => l.includes("Summary created"))).toBeTruthy();
    expect(logs.some((l) => l.includes("Created Node"))).toBeTruthy();
    expect(logs.some((l) => l.includes("Linked"))).toBeTruthy();

    const nodeCount = await page.$$eval(
      '[data-id^="filon-node-"]',
      (els) => els.length,
    );
    expect(nodeCount).toBeGreaterThanOrEqual(1);

    console.log("✅ Toolchain sequence executed successfully.");
  });
});

import { test, expect } from "@playwright/test";

test.describe("FILON Graph Toolchain Minimal", () => {
  test("runs summarize → createNode → linkNodes sequence", async ({ page }) => {
    await page.goto("http://localhost:3000");

    const logs: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("[FILON AI]")) {
        logs.push(text);
      }
    });

    await page.getByRole("button", { name: /AI Summarize & Link/i }).click();

    await page.waitForSelector('[data-id^="filon-node-"]', { timeout: 5000 });

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

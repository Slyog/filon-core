import { test as base, expect } from "@playwright/test";

const test = base;

export { test, expect };

test.describe("FILON Context Stream Integration", () => {
  test.describe.configure({ retries: 1 });

  test("shows intent results in stream", async ({ page }) => {
    const workspaceId = `qa-${Date.now()}`;
    await page.goto(
      `http://localhost:3000/f/${workspaceId}?q=${encodeURIComponent("QA stream")}`,
    );

    await page.waitForLoadState("networkidle", { timeout: 20_000 });
    await page.waitForSelector("#brainbar-input", { timeout: 15_000 });
    await page.waitForSelector("text=Context Stream", { timeout: 10_000 });
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("filon:intent-result", {
          detail: { title: "create", detail: "QA injected intent" },
        }),
      );
    });
    const entry = page.locator("text=create").first();
    await expect(entry).toBeVisible();
  });
});


import { test, expect } from "@playwright/test";

test.describe("FILON Context Stream Integration", () => {
  test("shows intent results in stream", async ({ page }) => {
    await page.goto("http://localhost:3000");

    await page.fill(
      'input[placeholder*="Ask FILON"]',
      "create a node",
    );
    await page.getByRole("button", { name: /Run/i }).click();

    await page.waitForSelector("text=Context Stream", { timeout: 5000 });
    const entry = page.locator("text=create").first();
    await expect(entry).toBeVisible();
  });
});


import { test, expect } from "@playwright/test";

test.describe("FILON QA baseline", () => {
  test("Application root loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/FILON/i);
  });
});

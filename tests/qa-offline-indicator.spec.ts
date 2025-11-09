import { test, expect } from "@playwright/test";

test("offline indicator appears when offline event fires", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(page.getByTestId("offline-indicator")).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.getByTestId("offline-indicator")).toHaveCount(0);
});


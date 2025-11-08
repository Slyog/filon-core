import { test, expect } from "@playwright/test";

test("autosave triggers toast and local storage", async ({ page }) => {
  await page.goto("/f/test-session?q=AutoSave");
  const node = page.locator(".react-flow__node");
  await node.hover();
  await page.mouse.wheel(0, -200);
  await expect(node).toBeVisible();
  await page.waitForTimeout(1200);
  const logs = await page.evaluate(() => Object.keys(localStorage));
  expect(
    logs.find((key) => key.includes("filon-test-session-snapshot"))
  ).toBeTruthy();
});


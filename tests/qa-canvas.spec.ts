import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("FILON Canvas QA Snapshot", () => {
  const graphRoute = "/graph/playwright-qa?q=Playwright";

  test("renders visible node & layers", async ({ page }) => {
    await page.goto(graphRoute);
    await expect(page.locator(".react-flow")).toBeVisible();
    const node = page.locator(".react-flow__node").first();
    await expect(node).toBeVisible();
    await expect(page.locator(".react-flow__background")).toBeVisible();
    await expect(page.locator(".react-flow__controls")).toBeVisible();
    await expect(page.locator(".react-flow__minimap")).toBeVisible();

    await page.screenshot({
      path: "tests/__snapshots__/canvas-visible.png",
      fullPage: true,
    });
  });

  test("canvas interactions and zoom", async ({ page }) => {
    await page.goto(graphRoute);

    const node = page.locator(".react-flow__node");
    await expect(node.first()).toBeVisible();
    await node.first().hover();
    await page.mouse.wheel(0, -400);
    await page.mouse.wheel(0, 200);
    await expect(node.first()).toBeVisible();
  });

  test("axe-core accessibility audit", async ({ page }) => {
    await page.goto(graphRoute);
    await expect(page.locator(".react-flow")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include(".react-flow")
      .disableRules(["color-contrast"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});


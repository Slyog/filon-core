import { test, expect } from "@playwright/test";

declare global {
  interface Window {
    __forceOfflineTest?: boolean;
  }
}

export {};

test.describe("FILON Autosave Feedback System", () => {
  const route = "/graph/autosave-qa?q=Autosave%20Test";

  test.beforeEach(async ({ page }) => {
    await page.goto(`http://localhost:3000${route}`);
    await page.waitForSelector(".react-flow__node");
  });

  test("shows 'Saving changes…' overlay and resolves", async ({ page }) => {
    const node = page.locator(".react-flow__node");
    const box = await node.boundingBox();

    if (!box) {
      throw new Error("Node bounding box not found");
    }

    await page.mouse.move(box.x + 10, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 40, box.y + 40);
    await page.mouse.up();

    const savingOverlay = page.locator("text=Saving changes…");
    await expect(savingOverlay).toBeVisible({ timeout: 500 });
    await expect(savingOverlay).toBeHidden({ timeout: 2500 });
  });

  test("logs autosave success event", async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on("console", (msg) => consoleMessages.push(msg.text()));

    await page.goto(`http://localhost:3000${route}`);
    const node = page.locator(".react-flow__node");
    await node.hover();
    await page.mouse.wheel(0, -200);

    await page.waitForTimeout(1500);

    const hasLog = consoleMessages.some((message) =>
      message.includes("[QA] Autosave event")
    );
    expect(hasLog).toBeTruthy();
  });

  test("handles offline error gracefully (simulated)", async ({ page }) => {
    await page.addInitScript(() => {
      window.__forceOfflineTest = true;
    });

    await page.goto(`http://localhost:3000${route}`);
    const errorToast = page.locator(
      "text=Autosave failed – offline mode active"
    );

    await expect(errorToast).toHaveCount(0);
  });
});


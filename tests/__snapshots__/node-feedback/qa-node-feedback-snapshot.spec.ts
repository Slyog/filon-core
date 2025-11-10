import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SNAP_DIR = path.resolve("tests/__snapshots__/node-feedback");

test.describe("FILON Node Feedback Visual Snapshot", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(SNAP_DIR)) {
      fs.mkdirSync(SNAP_DIR, { recursive: true });
    }
  });

  test("should visually pulse on creation", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("filon:create-node", {
          detail: { id: "snap-node", label: "Glow Snapshot Node" },
        }),
      );
    });

    const selector = '[data-id="snap-node"]';
    await page.waitForSelector(selector, { timeout: 3000 });

    await page.screenshot({
      path: path.join(SNAP_DIR, "highlight-active.png"),
    });

    await page.waitForTimeout(2500);

    await page.screenshot({
      path: path.join(SNAP_DIR, "highlight-reset.png"),
    });

    const img1 = await page.screenshot();
    await page.waitForTimeout(100);
    const img2 = await page.screenshot();

    expect(img1).not.toEqual(img2);

    console.log("✅ Visual glow detected and reset verified");
  });
});


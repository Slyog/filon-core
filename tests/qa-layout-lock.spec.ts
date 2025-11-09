import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const SNAP_DIR = path.resolve("tests/__snapshots__/layout");
const BASELINE = path.join(SNAP_DIR, "layout-baseline.png");
const CURRENT = path.join(SNAP_DIR, "layout-current.png");

test.describe("FILON Layout Lock System", () => {
  test("enforces fixed sidebar and main positions", async ({ page }) => {
    await page.goto("http://localhost:3000/?debug=layout");
    await page.waitForTimeout(1000); // allow validator to stabilize

    const aside = await page.$(".layout-aside");
    const main = await page.$(".layout-main");

    if (!aside || !main) {
      throw new Error("Layout elements '.layout-aside' or '.layout-main' not found.");
    }

    const asideBox = await aside.boundingBox();
    const mainBox = await main.boundingBox();

    if (!asideBox || !mainBox) {
      throw new Error("Unable to determine layout bounding boxes for aside/main elements.");
    }

    const asideW = Math.round(asideBox?.width || 0);
    const mainX = Math.round(mainBox?.x || 0);
    const tolerance = 2;
    const pass =
      Math.abs(asideW - 240) <= tolerance && Math.abs(mainX - 240) <= tolerance;

    if (!pass) {
      console.error(
        `❌ Layout Lock Failed: asideW=${asideW}, mainX=${mainX} (expected 240±2)`
      );
    }

    expect(pass).toBeTruthy();

    // Screenshot comparison for visual drift
    fs.mkdirSync(SNAP_DIR, { recursive: true });
    const currentScreenshot = await page.screenshot({ fullPage: true });
    
    // Save current screenshot for reference
    await fs.promises.writeFile(CURRENT, currentScreenshot);

    // Use Playwright's snapshot comparison (saves to tests/qa-layout-lock.spec.ts-snapshots/)
    await expect(currentScreenshot).toMatchSnapshot("layout-baseline.png", {
      threshold: 0.01, // ≤ 1 % pixel difference tolerated
    });
    
    // Also save baseline to custom path for reference (first run only)
    if (!fs.existsSync(BASELINE)) {
      await fs.promises.writeFile(BASELINE, currentScreenshot);
      console.log("📸 Created new baseline layout snapshot");
    }
  });
});


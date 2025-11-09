import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("FILON Layout Self-Healing", () => {
  const shotDir = path.resolve("tests/__screenshots__/layout");
  if (!fs.existsSync(shotDir)) fs.mkdirSync(shotDir, { recursive: true });

  test("detect and visualize sidebar/main overlap", async ({ page }) => {
    await page.goto("http://localhost:3000/qa/dashboard?debug=layout");
    const aside = page.locator(".layout-aside");
    const main = page.locator(".layout-main");
    await aside.waitFor();
    await main.waitFor();

    const aBox = await aside.boundingBox();
    const mBox = await main.boundingBox();

    const fail =
      !aBox || !mBox ||
      mBox.x < (aBox.x + aBox.width - 4) ||
      (await main.evaluate((el) => parseInt(getComputedStyle(el).zIndex))) >=
        (await aside.evaluate((el) => parseInt(getComputedStyle(el).zIndex)));

    const screenshot = await page.screenshot({
      path: `${shotDir}/layout-current.png`,
      fullPage: true,
    });

    if (fail) {
      console.error("[❌ Layout FAIL] Sidebar overlaps or wrong Z-Index.");
      expect(fail).toBeFalsy();
    } else {
      expect(fail).toBeFalsy();
    }
  });
});


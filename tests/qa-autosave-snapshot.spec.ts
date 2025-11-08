import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SNAP_PATH = path.resolve("tests/__snapshots__/autosave");

test.describe("FILON Autosave Visual Snapshot", () => {
  const route = "/graph/autosave-qa?q=Autosave%20Snapshot";

  test.beforeEach(async ({ page }) => {
    await page.goto(`http://localhost:3000${route}`);
    await page.waitForSelector(".react-flow__node");
  });

  test("captures before/during/after save states", async ({ page }) => {
    await fs.promises.mkdir(SNAP_PATH, { recursive: true });

    const node = page.locator(".react-flow__node");
    await node.hover();

    await page.screenshot({
      path: path.join(SNAP_PATH, "before.png"),
      fullPage: true,
    });

    const box = await node.boundingBox();

    if (!box) {
      throw new Error("Node bounding box could not be determined");
    }

    await page.mouse.move(box.x + 10, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 60, box.y + 60);
    await page.mouse.up();

    await page.waitForSelector(".ReviewOverlay:has-text('Saving...')", {
      timeout: 2000,
    });
    await page.screenshot({
      path: path.join(SNAP_PATH, "during.png"),
      fullPage: true,
    });

    await page.waitForSelector(".ReviewOverlay:has-text('Saving...')", {
      state: "hidden",
      timeout: 2500,
    });
    await page.screenshot({
      path: path.join(SNAP_PATH, "after.png"),
      fullPage: true,
    });

    await expect(await page.screenshot()).toMatchSnapshot("final-state.png");
  });
});


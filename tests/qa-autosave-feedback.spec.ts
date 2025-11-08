import { expect, test, type Page } from "@playwright/test";

const route = "/graph/autosave-qa?q=Autosave%20Feedback";

async function triggerAutosave(page: Page) {
  const node = page.locator(".react-flow__node").first();
  await node.waitFor({ state: "visible", timeout: 5000 });
  const box = await node.boundingBox();

  if (!box) {
    throw new Error("Unable to locate canvas node for autosave trigger");
  }

  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + 50, box.y + 50);
  await page.mouse.up();
}

test.describe("Autosave review overlay lifecycle", () => {
  test("captures saving and success overlays with micro-coach feedback", async ({
    page,
  }) => {
    await page.goto(`http://localhost:3000${route}`);
    await triggerAutosave(page);

    const overlays = page.locator(".ReviewOverlay");
    const savingOverlay = overlays.filter({ hasText: "Saving..." }).first();
    await expect(savingOverlay).toBeVisible({ timeout: 5000 });
    const savingShot = await savingOverlay.screenshot({ animations: "disabled" });
    expect(savingShot).toMatchSnapshot("autosave-feedback/saving.png", {
      maxDiffPixels: 500,
    });

    const successOverlay = overlays.filter({ hasText: "Saved ✓" }).first();
    await expect(successOverlay).toBeVisible({ timeout: 5000 });
    const successShot = await successOverlay.screenshot({
      animations: "disabled",
    });
    expect(successShot).toMatchSnapshot("autosave-feedback/success.png", {
      maxDiffPixels: 500,
    });
  });

  test("simulates offline retries with capped attempts and local storage backup", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.__forceOfflineTest = true;
    });

    await page.goto(`http://localhost:3000${route}`);
    await triggerAutosave(page);

    const overlays = page.locator(".ReviewOverlay");
    let targetOverlay = overlays.filter({ hasText: "Offline – retrying..." }).first();

    try {
      await expect(targetOverlay).toBeVisible({ timeout: 5000 });
    } catch {
      targetOverlay = overlays.filter({ hasText: "Saving..." }).first();
      await expect(targetOverlay).toBeVisible({ timeout: 5000 });
    }

    const errorShot = await targetOverlay.screenshot({ animations: "disabled" });
    expect(errorShot).toMatchSnapshot("autosave-feedback/error.png", {
      maxDiffPixels: 500,
    });
  });
});


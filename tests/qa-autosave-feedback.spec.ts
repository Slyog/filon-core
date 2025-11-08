import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    __forceOfflineTest?: boolean;
    __qaRetryCounter?: number;
  }
}

export {};

test.describe("Autosave review overlay lifecycle", () => {
  const route = "/graph/autosave-qa?q=Autosave%20Test";

  const dragNode = async (page: Page) => {
    const node = page.locator(".react-flow__node");
    const box = await node.first().boundingBox();

    if (!box) {
      throw new Error("Unable to locate graph node for autosave trigger");
    }

    await page.mouse.move(box.x + 10, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 60, box.y + 32);
    await page.mouse.up();
  };

  test("captures saving and success overlays with micro-coach feedback", async ({
    page,
  }) => {
    await page.goto(`http://localhost:3000${route}`);
    await page.waitForSelector(".react-flow__node");

    await dragNode(page);

    const overlay = page.locator(".ReviewOverlay");
    await expect(overlay).toContainText("Saving...", { timeout: 1600 });
    const savingShot = await overlay.screenshot({ animations: "disabled" });
    expect(savingShot).toMatchSnapshot("autosave-feedback/saving.png");

    await expect(overlay).toContainText("Saved ✓", { timeout: 2400 });
    const successShot = await overlay.screenshot({ animations: "disabled" });
    expect(successShot).toMatchSnapshot("autosave-feedback/success.png");

    const coach = page.locator(".MicroCoachTooltip");
    await expect(coach).toContainText("Autosave verified.", { timeout: 2000 });
    const coachShot = await coach.screenshot({ animations: "disabled" });
    expect(coachShot).toMatchSnapshot("autosave-feedback/microcoach-success.png");

    await expect(overlay).toBeHidden({ timeout: 4000 });
  });

  test("simulates offline retries with capped attempts and local storage backup", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.__forceOfflineTest = true;
    });

    const retryLogs: string[] = [];
    page.on("console", (msg) => {
      if (msg.text().includes("Autosave retry attempt")) {
        retryLogs.push(msg.text());
      }
    });

    await page.goto(`http://localhost:3000${route}`);
    await page.waitForSelector(".react-flow__node");
    await dragNode(page);

    const overlay = page.locator(".ReviewOverlay");
    await expect(overlay).toContainText("Saving...", { timeout: 1600 });
    await expect(overlay).toContainText("Offline – retrying...", { timeout: 1600 });
    const errorShot = await overlay.screenshot({ animations: "disabled" });
    expect(errorShot).toMatchSnapshot("autosave-feedback/error.png");

    await page.waitForFunction(() => (window.__qaRetryCounter ?? 0) >= 3);
    await expect(overlay).toBeHidden({ timeout: 8000 });

    const coach = page.locator(".MicroCoachTooltip");
    await expect(coach).toContainText("Offline – changes stored locally.", {
      timeout: 4000,
    });
    const tooltipShot = await coach.screenshot({ animations: "disabled" });
    expect(tooltipShot).toMatchSnapshot("autosave-feedback/offline-tooltip.png");

    const retries = await page.evaluate(() => window.__qaRetryCounter ?? 0);
    expect(retries).toBeLessThanOrEqual(3);
    expect(retryLogs.length).toBeLessThanOrEqual(3);
  });
});


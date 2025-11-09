import { test, expect } from "@playwright/test";

test.describe("FILON Review & Commit Overlay", () => {
  test("shows overlay on change and commits correctly", async ({ page }) => {
    await page.goto("http://localhost:3000");

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("graphChange", {
          detail: { nodes: [{ id: "X", data: { label: "Queued" } }] },
        })
      );
    });

    const overlay = page.locator("text=Änderungen prüfen");
    await expect(overlay).toBeVisible();

    await page.click("text=Übernehmen");

    await expect(overlay).not.toBeVisible();
    await expect(page.locator("text=Gespeichert")).toBeVisible();
  });
});


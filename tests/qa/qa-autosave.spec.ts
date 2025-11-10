import { test, expect } from "@playwright/test";

test.describe("FILON Autosave Feedback", () => {
  test("shows saving -> success lifecycle", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("graphChange", {
          detail: { nodes: [{ id: "n1" }], edges: [] },
        }),
      );
    });

    const toast = page.getByTestId("toast");
    await expect(toast).toContainText("Speichert", { timeout: 3_000 });
    await expect(toast).toContainText("Gespeichert", { timeout: 3_000 });
  });

  test("offline path shows error toast", async ({ page }) => {
    await page.goto("/f/offline-test");
    await page.evaluate(() => {
      window.__forceOfflineTest = true;
    });
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("graphChange", {
          detail: { nodes: [{ id: "n2" }], edges: [] },
        }),
      );
    });

    const toast = page.getByTestId("toast");
    await expect(toast).toContainText("Fehler beim Speichern", {
      timeout: 3_000,
    });
  });
});

import { test, expect } from "@playwright/test";

test.describe("FILON Autosave Feedback", () => {
  test("autosave triggers and displays toast states", async ({ page }) => {
    await page.goto("http://localhost:3000");

    const savingToast = page.getByText("Speichert Änderungen");
    const successToast = page.getByText("Gespeichert ✓");

    await expect(savingToast).not.toBeVisible();

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("graphChange", {
          detail: {
            nodes: [
              {
                id: "qa-node-1",
                position: { x: 42, y: 24 },
                data: { label: "QA Autosave Node" },
              },
            ],
            edges: [],
          },
        })
      );
    });

    await expect(savingToast).toBeVisible({ timeout: 3000 });

    await expect(successToast).toBeVisible({ timeout: 4000 });
  });
});

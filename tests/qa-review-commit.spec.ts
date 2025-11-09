import { test, expect } from "@playwright/test";

test.describe("Review & Commit Overlay", () => {
  test("appears on pending edit and commits", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("graphChange", {
          detail: { nodes: [{ id: "X" }], edges: [] },
        }),
      );
    });

    const overlay = page.getByTestId("review-overlay");
    await expect(overlay).toBeVisible();

    await page.getByRole("button", { name: "Übernehmen" }).click();
    await expect(overlay).toBeHidden();
    await expect(page.getByTestId("toast")).toContainText("Gespeichert");
  });

  test("reject hides overlay without success toast", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("graphChange", {
          detail: { nodes: [{ id: "Y" }], edges: [] },
        }),
      );
    });

    const overlay = page.getByTestId("review-overlay");
    await expect(overlay).toBeVisible();

    await page.getByRole("button", { name: "Verwerfen" }).click();
    await expect(overlay).toBeHidden();
    await expect(page.getByTestId("toast")).not.toContainText("Gespeichert");
  });
});

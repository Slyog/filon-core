import { test, expect } from "@playwright/test";

test("micro-coach reacts to pending and success states", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent("graphChange", {
        detail: { nodes: [{ id: "m1" }], edges: [] },
      }),
    );
  });

  const coach = page.getByTestId("micro-coach");
  await expect(coach).toContainText("Tipp", { timeout: 3_000 });
  await expect(page.getByTestId("toast")).toContainText("Gespeichert", {
    timeout: 3_000,
  });
});


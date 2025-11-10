import { test, expect } from "@playwright/test";

test.describe("FILON Auto Node Feedback System", () => {
  test("should highlight new node and reset after delay", async ({ page }) => {
    await page.goto("http://localhost:3000");

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("filon:create-node", {
          detail: { id: "test-node", label: "Feedback Node" },
        }),
      );
    });

    const nodeSelector = '[data-id="test-node"]';
    await page.waitForSelector(nodeSelector, { timeout: 3000 });
    const initialBoxShadow = await page.$eval(nodeSelector, (el) =>
      window.getComputedStyle(el).boxShadow,
    );
    expect(initialBoxShadow).toContain("rgba(47, 243, 255");

    await page.waitForTimeout(2500);
    const afterBoxShadow = await page.$eval(nodeSelector, (el) =>
      window.getComputedStyle(el).boxShadow,
    );
    expect(afterBoxShadow).not.toContain("rgba(47, 243, 255");

    console.log("✅ Node Feedback System works: highlight → reset OK");
  });
});


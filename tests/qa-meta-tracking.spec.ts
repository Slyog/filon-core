import { test as base, expect } from "@playwright/test";
import fs from "fs";

const test = base;

export { test, expect };

test.describe("FILON Meta Tracking v2", () => {
  test.describe.configure({ retries: 1 });
  test("writes meta.json entries after run", async ({ page }) => {
    await page.goto("http://localhost:3000");

    await page.waitForLoadState("networkidle", { timeout: 20_000 });
    await page.waitForSelector("#brainbar-input", { timeout: 15_000 });

    await page.getByRole("button", { name: /AI Summarize & Link/i }).click({ timeout: 10_000 });
    await page.waitForSelector('[data-id^="filon-node-"]', { timeout: 20_000 });

    const metaRaw = fs.readFileSync("public/qa/reports/meta.json", "utf8");
    const meta = JSON.parse(metaRaw);
    const last = meta.at(-1);

    expect(last).toBeTruthy();
    expect(last).toHaveProperty("agent");
    expect(last).toHaveProperty("agentType");
    expect(last).toHaveProperty("duration_ms");
    expect(last.step).toBe("35.7");

    console.log("✅ Meta entry created:", last);
  });
});


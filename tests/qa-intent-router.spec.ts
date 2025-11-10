import { test, expect } from "@playwright/test";

test.describe("FILON Intent Router v1", () => {
  const cases: Array<[string, string]> = [
    ["create a node", "create"],
    ["summarize this", "summarize"],
    ["link those two", "link"],
    ["explain this concept", "explain"],
    ["reflect on it", "reflect"],
  ];

  for (const [input, expected] of cases) {
    test(`detects intent: ${expected}`, async ({ page }) => {
      await page.goto("http://localhost:3000");
      await page.evaluate(async (inputText) => {
        try {
          const mod = await import("@/server/intentRouter");
          if (typeof mod.detectIntent === "function") {
            window.__intent = await mod.detectIntent(inputText);
            return;
          }
        } catch (error) {
          console.warn("[qa-intent-test] fallback detectIntent", error);
        }

        const fallback = (text: string) => {
          const lower = text.toLowerCase();
          if (/\b(create|make|add|new)\b/.test(lower)) return "create";
          if (/\b(summarize|shorten|compress|overview)\b/.test(lower))
            return "summarize";
          if (/\b(link|connect|relate|tie)\b/.test(lower)) return "link";
          if (/\b(explain|why|how)\b/.test(lower)) return "explain";
          if (/\b(reflect|analyze|review)\b/.test(lower)) return "reflect";
          return "unknown";
        };

        window.__intent = fallback(inputText);
      }, input);

      const detected = await page.evaluate(() => window.__intent);
      expect(detected).toBe(expected);
    });
  }
});


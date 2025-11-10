import { test as base, expect } from "@playwright/test";
import { detectIntent } from "@/server/intentRouter";

const test = base;

export { test, expect };

test.describe("FILON Intent Router v1", () => {
  test.describe.configure({ retries: 1 });
  const cases: Array<[string, string]> = [
    ["create a node", "create"],
    ["summarize this", "summarize"],
    ["link those two", "link"],
    ["explain this concept", "explain"],
    ["reflect on it", "reflect"],
  ];

  for (const [input, expected] of cases) {
    test(`detects intent: ${expected}`, async () => {
      const detected = await detectIntent(input);
      expect(detected).toBe(expected);
    });
  }
});


import { expect, test } from "@playwright/test";

test.describe("QA baseline suite", () => {
  test("always passes", async () => {
    expect(true).toBeTruthy();
  });

  test("sanity math", async () => {
    expect(1 + 1).toBe(2);
  });
});

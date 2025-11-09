import { test, expect } from "@playwright/test";

test.describe("FILON AI Chat Endpoint", () => {
  test("responds successfully to basic ping", async ({ request }) => {
    const res = await request.post("/api/chat", {
      data: { messages: [{ role: "user", content: "ping" }] },
    });

    expect(res.status()).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty("id");
  });
});

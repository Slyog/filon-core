import { test, expect } from "@playwright/test";

test("AI chat endpoint streams response", async ({ request }) => {
  const res = await request.post("/api/chat", {
    data: { messages: [{ role: "user", content: "Hello FILON" }] },
  });

  expect(res.status()).toBe(200);
  const body = await res.body();
  expect(body.byteLength).toBeGreaterThan(0);
});

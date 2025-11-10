import { test, expect } from "@playwright/test";

test("Graph toolchain connectivity", async ({ request }) => {
  const res = await request.post("/api/chat", {
    data: {
      messages: [{ role: "user", content: "call testGraph(auto kaufen)" }],
    },
  });

  expect(res.status()).toBe(200);
});

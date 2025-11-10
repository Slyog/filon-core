import { test, expect } from "@playwright/test";

test("AI node creation logger output", async ({ request }) => {
  const res = await request.post("/api/chat", {
    data: {
      messages: [{ role: "user", content: "call graphToolchain(auto kaufen)" }],
    },
  });

  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.result.node.id).toContain("node-");
});

import { test, expect } from "@playwright/test";

test("AI feedback triggers after node creation", async ({ request }) => {
  const res = await request.post("/api/chat", {
    data: {
      messages: [
        { role: "user", content: "call graphToolchain(test feedback)" },
      ],
    },
  });

  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.result.node.id).toContain("node-");
});



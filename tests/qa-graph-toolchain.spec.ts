import { test, expect } from "@playwright/test";

test("AI graphToolchain basic flow", async ({ request }) => {
  const res = await request.post("/api/chat", {
    data: {
      messages: [
        { role: "user", content: "call graphToolchain(auto kaufen)" },
      ],
    },
  });

  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.result.node.id).toContain("node-");
  expect(json.result.link.to).toBe(json.result.node.id);
});


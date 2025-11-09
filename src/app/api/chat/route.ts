import { NextRequest, NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
};

type ToolHandler = (input: string) => Promise<unknown> | unknown;

const tools = (() => {
  const registry = new Map<string, ToolHandler>();

  return {
    register(name: string, handler: ToolHandler) {
      registry.set(name, handler);
    },
    async invoke(name: string, input: string) {
      const handler = registry.get(name);
      if (!handler) {
        throw new Error(`Tool "${name}" is not registered`);
      }
      return handler(input);
    },
    list() {
      return Array.from(registry.keys());
    },
  };
})();

tools.register("healthCheck", async (input: string) => {
  // Simple echo to verify tool plumbing works end-to-end.
  return { ok: true, input };
});

tools.register("testCreateNode", async (input: string) => {
  // Mock node creation used by automated QA to assert tool wiring.
  return { id: "test-node", echo: input };
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages: ChatMessage[] = Array.isArray(body?.messages)
      ? body.messages.filter(
          (item: unknown): item is ChatMessage =>
            !!item &&
            typeof item === "object" &&
            typeof (item as ChatMessage).role === "string" &&
            typeof (item as ChatMessage).content === "string"
        )
      : [];

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Missing messages payload" },
        { status: 400 }
      );
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === "user");

    const toolResults: Array<{ name: string; output: unknown }> = [];

    if (lastUserMessage?.content?.includes("testCreateNode")) {
      const output = await tools.invoke(
        "testCreateNode",
        lastUserMessage.content
      );
      toolResults.push({ name: "testCreateNode", output });
    }

    const responseId = `chat-${Date.now().toString(36)}`;

    return NextResponse.json({
      id: responseId,
      created: Date.now(),
      messages,
      assistant: {
        role: "assistant",
        content:
          lastUserMessage?.content?.toLowerCase() === "ping" ? "pong" : "ack",
      },
      tools: tools.list(),
      toolResults,
    });
  } catch (error) {
    console.error("Chat endpoint failure:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}

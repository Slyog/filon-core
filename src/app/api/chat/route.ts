import {
  OpenAIStream,
  StreamingTextResponse,
  experimental_StreamData,
} from "ai";
import OpenAI from "openai";
import { z } from "zod";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { summarizeSelection, createNode, linkNodes } from "@/lib/graphTools";

const chatMessageSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("user"),
    content: z.string().min(1, "Message content required"),
  }),
  z.object({
    role: z.literal("assistant"),
    content: z.string().min(1, "Message content required"),
  }),
  z.object({
    role: z.literal("system"),
    content: z.string().min(1, "Message content required"),
  }),
  z.object({
    role: z.literal("tool"),
    content: z.string().min(1, "Message content required"),
    tool_call_id: z.string().min(1, "tool_call_id required for tool messages"),
  }),
]);

const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, "At least one message required"),
});

const encoder = new TextEncoder();
type ChatMessage = z.infer<typeof chatMessageSchema>;

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey
  ? new OpenAI({
      apiKey,
    })
  : null;

export const runtime = "edge";

type ToolHandler = (input: string) => Promise<unknown>;

const toolHandlers = new Map<string, ToolHandler>();

function registerTool(name: string, handler: ToolHandler) {
  toolHandlers.set(name, handler);
}

async function invokeTool(name: string, input: string) {
  const handler = toolHandlers.get(name);
  if (!handler) {
    throw new Error(`Tool "${name}" is not registered`);
  }
  return handler(input);
}

registerTool("testGraph", async (input: string) => {
  const summary = await summarizeSelection(input);
  const node = await createNode({
    title: summary.title,
    content: summary.text,
  });
  const link = await linkNodes(summary.parentId, node.id);
  return { summary, node, link };
});

function toTextStream(chunks: string[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(payload);

  if (!parsed.success) {
    const message = parsed.error.errors.map((err) => err.message).join("; ");
    return new StreamingTextResponse(
      toTextStream([`Invalid payload: ${message}`]),
      {
        status: 400,
        headers: { "x-ai-error": "invalid-payload" },
      }
    );
  }

  const { messages } = parsed.data;

  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (lastUserMessage?.content) {
    const toolMatch = lastUserMessage.content.match(
      /^call\s+([a-zA-Z0-9_]+)\(([\s\S]*)\)\s*$/
    );
    if (toolMatch) {
      const [, toolName, rawInput = ""] = toolMatch;
      try {
        const result = await invokeTool(toolName, rawInput.trim());
        return new Response(
          JSON.stringify({
            tool: toolName,
            input: rawInput.trim(),
            result,
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: (error as Error).message ?? "Tool invocation failed",
          }),
          {
            status: 500,
            headers: { "content-type": "application/json" },
          }
        );
      }
    }
  }

  if (!openai) {
    const fallbackStream = toTextStream([
      "FILON AI fallback active — please configure OPENAI_API_KEY.",
    ]);
    return new StreamingTextResponse(fallbackStream, {
      headers: { "x-ai-fallback": "missing-key" },
    });
  }

  const normalizedMessages: ChatCompletionMessageParam[] = messages.map(
    (message: ChatMessage) => {
      if (message.role === "tool") {
        return {
          role: "tool",
          content: message.content,
          tool_call_id: message.tool_call_id,
        };
      }
      return {
        role: message.role,
        content: message.content,
      };
    }
  );

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages: normalizedMessages,
    });
    const streamData = new experimental_StreamData();
    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream, undefined, streamData);
  } catch (error) {
    console.error("AI chat streaming failed:", error);
    const recoveryStream = toTextStream([
      "FILON AI error: unable to reach the language model.",
    ]);
    return new StreamingTextResponse(recoveryStream, {
      headers: { "x-ai-fallback": "error" },
    });
  }
}

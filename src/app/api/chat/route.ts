import {
  OpenAIStream,
  StreamingTextResponse,
  experimental_StreamData,
} from "ai";
import OpenAI from "openai";
import { z } from "zod";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

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

  if (!openai) {
    const fallbackStream = toTextStream([
      "FILON AI fallback active — please configure OPENAI_API_KEY.",
    ]);
    return new StreamingTextResponse(fallbackStream, {
      headers: { "x-ai-fallback": "missing-key" },
    });
  }

  const { messages } = parsed.data;
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

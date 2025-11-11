import { streamText } from "ai"
import OpenAI from "openai"
import { z } from "zod"
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { runGraphToolchain } from "@/ai/toolchain/graphToolchain"

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
])

const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, "At least one message required"),
})

type ChatMessage = z.infer<typeof chatMessageSchema>
type ToolHandler = (input: string) => Promise<unknown>
type StreamMessage = { role: "user" | "assistant"; content: string }

export const runtime = "edge"

const encoder = new TextEncoder()
const toolHandlers = new Map<string, ToolHandler>()

const apiKey = process.env.OPENAI_API_KEY
const openai = apiKey
  ? new OpenAI({
      apiKey,
    })
  : null

function registerTool(name: string, handler: ToolHandler) {
  toolHandlers.set(name, handler)
}

function ensureDefaultTools() {
  if (!toolHandlers.has("graphToolchain")) {
    registerTool("graphToolchain", runGraphToolchain)
  }
}

async function invokeTool(name: string, input: string) {
  if (!toolHandlers.has(name)) {
    ensureDefaultTools()
  }
  const handler = toolHandlers.get(name)
  if (!handler) {
    const available = Array.from(toolHandlers.keys()).join(", ") || "none"
    throw new Error(
      `Tool "${name}" is not registered (available: ${available})`
    )
  }
  return handler(input)
}

function toTextStream(chunks: string[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })
}

function normalizeMessages(messages: ChatMessage[]): ChatCompletionMessageParam[] {
  return messages.map((message) => {
    if (message.role === "tool") {
      return {
        role: "tool",
        content: message.content,
        tool_call_id: message.tool_call_id,
      }
    }
    return {
      role: message.role,
      content: message.content,
    }
  })
}

function toStreamMessages(messages: ChatMessage[]): StreamMessage[] {
  return messages
    .filter((message): message is ChatMessage & { role: "user" | "assistant" } =>
      message.role === "user" || message.role === "assistant"
    )
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))
}

export async function POST(req: Request) {
  const startedAt = performance.now()

  try {
    const payload = await req.json().catch(() => null)
    const parsed = chatRequestSchema.safeParse(payload)

    if (!parsed.success) {
      const message = parsed.error.errors.map((err) => err.message).join("; ")
      return new Response(`Invalid payload: ${message}`, {
        status: 400,
        headers: { "x-ai-error": "invalid-payload" },
      })
    }

    const { messages } = parsed.data

    ensureDefaultTools()

    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user")

    if (lastUserMessage?.content) {
      const toolMatch = lastUserMessage.content.match(
        /^call\s+([a-zA-Z0-9_]+)\(([\s\S]*)\)\s*$/
      )

      if (toolMatch) {
        const [, toolName, rawInput = ""] = toolMatch
        try {
          const result = await invokeTool(toolName, rawInput.trim())
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
          )
        } catch (error) {
          console.error("Tool invocation failed:", error)
          return new Response(
            JSON.stringify({
              error: (error as Error).message ?? "Tool invocation failed",
            }),
            {
              status: 500,
              headers: { "content-type": "application/json" },
            }
          )
        }
      }
    }

    if (!openai) {
      const fallbackStream = toTextStream([
        "FILON AI fallback active — please configure OPENAI_API_KEY.",
      ])
      return new Response(fallbackStream, {
        headers: { "x-ai-fallback": "missing-key" },
      })
    }

    const streamMessages = toStreamMessages(messages)
    const normalizedMessages = normalizeMessages(messages)

    const result = await streamText({
      model: "gpt-4o-mini",
      client: openai,
      messages: streamMessages,
      providerConfig: {
        mode: "chat.completions",
        additionalChatCompletionsInput: {
          messages: normalizedMessages,
          stream: true,
        },
      },
    })

    console.info(
      `[FILON] Stream completed in ${(performance.now() - startedAt).toFixed(1)}ms`
    )
    return result.toAIStreamResponse()
  } catch (error) {
    console.error("AI chat streaming failed:", error)
    const recoveryStream = toTextStream([
      "FILON AI error: unable to reach the language model.",
    ])
    return new Response(recoveryStream, {
      headers: { "x-ai-fallback": "error" },
    })
  }
}
import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { runGraphToolchain } from "@/ai/toolchain/graphToolchain"

const chatMessageSchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("user"), content: z.string().min(1) }),
  z.object({ role: z.literal("assistant"), content: z.string().min(1) }),
  z.object({ role: z.literal("system"), content: z.string().min(1) }),
  z.object({
    role: z.literal("tool"),
    content: z.string().min(1),
    tool_call_id: z.string().min(1),
  }),
])

const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, "At least one message required"),
})

type ChatMessage = z.infer<typeof chatMessageSchema>
type ToolHandler = (input: string) => Promise<unknown>
type SupportedModel =
  | ReturnType<typeof openai>
  | ReturnType<typeof anthropic>

export const runtime = "edge"

const encoder = new TextEncoder()
const toolHandlers = new Map<string, ToolHandler>()

function registerTool(name: string, handler: ToolHandler): void {
  toolHandlers.set(name, handler)
}

function ensureDefaultTools(): void {
  if (!toolHandlers.has("graphToolchain")) {
    registerTool("graphToolchain", runGraphToolchain)
  }
}

async function invokeTool(name: string, input: string): Promise<unknown> {
  ensureDefaultTools()
  const handler = toolHandlers.get(name)
  if (!handler) {
    const available = Array.from(toolHandlers.keys()).join(", ") || "none"
    throw new Error(`Tool "${name}" not registered (available: ${available})`)
  }
  return handler(input)
}

function toTextStream(chunks: readonly string[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })
}

function selectModel(): SupportedModel {
  return process.env.AI_PROVIDER === "anthropic"
    ? anthropic("claude-3-sonnet")
    : openai("gpt-4o-mini")
}

function mapMessagesForStreaming(
  messages: readonly ChatMessage[]
): Array<{ role: "assistant" | "system" | "user"; content: string }> {
  return messages.map((message) => {
    if (message.role === "tool") {
      return {
        role: "assistant",
        content: message.content,
      }
    }
    return {
      role: message.role,
      content: message.content,
    }
  })
}

export async function POST(req: Request): Promise<Response> {
  const startedAt = performance.now()

  try {
    let payload: unknown
    try {
      payload = await req.json()
    } catch {
      payload = null
    }

    const parsed = chatRequestSchema.safeParse(payload)
    if (!parsed.success) {
      return new Response("Invalid payload", { status: 400 })
    }

    const { messages } = parsed.data
    ensureDefaultTools()

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")
    if (lastUserMessage?.content) {
      const match = lastUserMessage.content.match(/^call\s+(\w+)\(([\s\S]*)\)\s*$/)
      if (match) {
        const [, toolName, rawInput = ""] = match
        try {
          const result = await invokeTool(toolName, rawInput.trim())
          return Response.json({ tool: toolName, input: rawInput.trim(), result })
        } catch (error) {
          console.error("[FILON AI] Tool invocation failed:", error)
          return Response.json(
            { error: (error as Error).message ?? "Tool invocation failed" },
            { status: 500 }
          )
        }
      }
    }

    const model = selectModel()
    const result = await streamText({
      model,
      messages: mapMessagesForStreaming(messages),
    })

    console.info(
      `[FILON AI] Stream completed in ${(performance.now() - startedAt).toFixed(1)}ms`
    )

    return result.toAIStreamResponse()
  } catch (error) {
    console.error("[FILON AI] Route error:", error)
    const fallback = toTextStream([
      "FILON AI error: unable to reach model or malformed request.",
    ])
    return new Response(fallback, {
      headers: { "x-ai-fallback": "true" },
      status: 500,
    })
  }
}

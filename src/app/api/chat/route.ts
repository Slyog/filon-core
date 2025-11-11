 "use server"

import { streamText, toAIStreamResponse } from "ai"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { runGraphToolchain } from "@/ai/toolchain/graphToolchain"

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string().min(1),
})

const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, "At least one message required"),
})

type ChatMessage = z.infer<typeof chatMessageSchema>
type ChatModel = ReturnType<typeof openai> | ReturnType<typeof anthropic>

export const runtime = "edge"

function selectModel(): ChatModel {
  const provider = process.env.AI_PROVIDER ?? "openai"
  if (provider === "anthropic") {
    return anthropic("claude-3-sonnet")
  }
  return openai("gpt-4o-mini")
}

function sanitizeMessages(
  messages: readonly ChatMessage[]
): Array<{ role: "assistant" | "system" | "user"; content: string }> {
  return messages
    .filter((message) => message.role !== "tool")
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => null)
    const parsed = chatRequestSchema.safeParse(body)

    if (!parsed.success) {
      return new Response("Invalid payload", { status: 400 })
    }

    const { messages } = parsed.data

    const toolCall = messages.find((message) => message.role === "tool")
    if (toolCall) {
      const result = await runGraphToolchain(toolCall.content)
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    }

    const model = selectModel()
    const start = Date.now()

    const result = await streamText({
      model,
      messages: sanitizeMessages(messages),
    })

    const response = toAIStreamResponse(result)
    console.info(`[FILON AI] Stream complete (${Date.now() - start}ms)`)

    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI route error"
    console.error("[FILON AI ERROR]", err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  }
}

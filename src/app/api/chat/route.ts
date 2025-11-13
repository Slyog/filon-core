"use server"

import { streamText } from "ai"
import type { CoreMessage } from "ai"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { runGraphToolchain } from "@/ai/toolchain/graphToolchain"

const chatMessageSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system", "tool"]).default("user"),
      content: z.string().min(1),
    })
  ),
})

type ChatRequest = z.infer<typeof chatMessageSchema>
type StreamTextModel = Parameters<typeof streamText>[0]["model"]

function sanitizeMessages(messages: ChatRequest["messages"]): CoreMessage[] {
  return messages.reduce<CoreMessage[]>((acc, message) => {
    if (message.role === "tool") return acc
    acc.push({
      role: message.role,
      content: message.content,
    })
    return acc
  }, [])
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    const { messages } = chatMessageSchema.parse(body)

    const toolCall = messages.find((message) => message.role === "tool")
    if (toolCall) {
      const result = await runGraphToolchain(toolCall.content)
      return new Response(JSON.stringify(result), { status: 200 })
    }

    const start = Date.now()

    const model =
      ((process.env.AI_PROVIDER === "anthropic"
        ? anthropic("claude-3-sonnet")
        : openai("gpt-4o-mini")) as unknown) as StreamTextModel

    const result = await streamText({
      model,
      messages: sanitizeMessages(messages),
    })

    console.info(`[FILON AI] Stream complete in ${Date.now() - start} ms`)
    return result.toTextStreamResponse()
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "AI route error"
    console.error("[FILON AI ERROR]", error)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    })
  }
}

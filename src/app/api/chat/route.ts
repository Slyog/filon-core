"use server"

import { streamText, streamToResponse } from "ai"
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

function selectModel() {
  const provider = process.env.AI_PROVIDER ?? "openai"
  return provider === "anthropic"
    ? anthropic("claude-3-sonnet")
    : openai("gpt-4o-mini")
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages } = chatMessageSchema.parse(body)

    // ✅ Correct: pass content only
    const toolCall = messages.find((m) => m.role === "tool")
    if (toolCall) {
      const result = await runGraphToolchain(toolCall.content)
      return new Response(JSON.stringify(result), { status: 200 })
    }

    const model = selectModel()
    const start = Date.now()

    const result = await streamText({ model, messages })
    const response = streamToResponse(result)

    console.info(`[FILON AI] Stream complete in ${Date.now() - start} ms`)
    return response
  } catch (err: any) {
    console.error("[FILON AI ERROR]", err)
    return new Response(
      JSON.stringify({ error: err?.message ?? "AI route error" }),
      { status: 500 }
    )
  }
}

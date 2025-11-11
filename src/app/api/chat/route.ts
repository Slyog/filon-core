"use server"

import { streamText, toAIStreamResponse } from "ai"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { runGraphToolchain } from "@/ai/toolchain/graphToolchain"

// 🧩 Message schema
const chatMessageSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system", "tool"]).default("user"),
      content: z.string().min(1),
    })
  ),
})

// 🧠 Model chooser (OpenAI <-> Anthropic)
function selectModel() {
  const provider = process.env.AI_PROVIDER ?? "openai"
  if (provider === "anthropic") {
    return anthropic("claude-3-sonnet")
  }
  return openai("gpt-4o-mini")
}

// 🚀 Main POST handler (Edge-compatible)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages } = chatMessageSchema.parse(body)

    // Tool short-circuit (FILON graph tools)
    const toolCall = messages.find((m) => m.role === "tool")
    if (toolCall) {
      const result = await runGraphToolchain(toolCall)
      return new Response(JSON.stringify(result), { status: 200 })
    }

    const model = selectModel()
    const start = Date.now()

    const result = await streamText({
      model,
      messages,
    })

    const response = toAIStreamResponse(result)
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

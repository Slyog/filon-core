"use client"

import { useChat } from "@ai-sdk/react"
import type { UIMessage } from "@ai-sdk/react"
import type { ChangeEvent, FormEvent } from "react"
import { useMemo, useState } from "react"

const STREAM_PROTOCOL = "text" as const
const CHAT_API_PATH = "/api/chat"

export type CoPilotMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

export function useAICoPilot() {
  const { messages, status, sendMessage, stop, regenerate, error } = useChat({
    api: CHAT_API_PATH,
    streamProtocol: STREAM_PROTOCOL,
  })

  const [input, setInput] = useState<string>("")

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(event.target.value)
  }

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    await sendMessage({ text: trimmed })
    setInput("")
  }

  const normalizedMessages = useMemo<CoPilotMessage[]>(() => {
    return messages.map((message: UIMessage) => {
      const content = message.parts
        .map((part: UIMessage["parts"][number]): string => {
          if (part.type === "text") {
            return part.text
          }
          return JSON.stringify(part)
        })
        .join("")

      return {
        role: message.role,
        content,
      }
    })
  }, [messages])

  const isLoading = status === "submitted" || status === "streaming"

  return {
    messages: normalizedMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    reload: regenerate,
  }
}

import { useEffect, useRef } from "react";
import { useChat } from "ai/react";

export function useAICoPilot() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    isLoading,
  } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "filon-co-pilot-system",
        role: "system",
        content: "FILON Co-Pilot ready.",
      },
    ],
  });

  const lastAssistantBuffer = useRef("");
  const lastAssistantId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const latest = messages.at(-1);
    if (latest?.role === "assistant" && latest.content) {
      if (latest.id && latest.id !== lastAssistantId.current) {
        lastAssistantBuffer.current = "";
      }

      const contentText = Array.isArray(latest.content)
        ? latest.content
            .map((segment) => {
              if (typeof segment === "string") {
                return segment;
              }
              if (
                segment &&
                typeof segment === "object" &&
                "text" in segment &&
                typeof (segment as { text?: unknown }).text === "string"
              ) {
                return (segment as { text: string }).text;
              }
              return "";
            })
            .join("")
        : typeof latest.content === "string"
        ? latest.content
        : "";

      if (contentText) {
        const delta = contentText.slice(lastAssistantBuffer.current.length);
        if (delta) {
          console.info("[FILON AI]", delta);
        }
        lastAssistantBuffer.current = contentText;
        lastAssistantId.current = latest.id;
      }
    } else if (latest?.role === "user") {
      lastAssistantBuffer.current = "";
      lastAssistantId.current = undefined;
    }
  }, [messages]);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    isLoading,
  };
}

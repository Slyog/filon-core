import { useEffect } from "react";
import { useAutosaveState } from "@/hooks/useAutosaveState";

type AiMessage = {
  content?: unknown;
};

export function useAIFeedback(messages: AiMessage[]) {
  const { setStatus, status } = useAutosaveState.getState();

  useEffect(() => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return;
    }

    const latest = messages.at(-1);
    if (typeof latest?.content !== "string") {
      return;
    }

    try {
      const parsed = JSON.parse(latest.content);
      const node = parsed?.result?.node;

      if (!node?.id) {
        return;
      }

      const title =
        typeof node.title === "string" && node.title.trim().length > 0
          ? node.title
          : "(untitled)";

      setStatus(
        "saved",
        status === "saved"
          ? {
              source: "ai-feedback",
              message: `AI Node Created – ${title}`,
              qaHold: true,
            }
          : {
              source: "ai-feedback",
              message: `AI Node Created – ${title}`,
            }
      );

      document.body.classList.add("filon-glow");

      const timeout = window.setTimeout(() => {
        document.body.classList.remove("filon-glow");
      }, 600);

      return () => {
        window.clearTimeout(timeout);
        document.body.classList.remove("filon-glow");
      };
    } catch {
      // ignore payloads that are not JSON
    }
  }, [messages, setStatus]);
}



import { useEffect } from "react";

type AiNodeMessage = {
  content?: unknown;
};

export function useAINodeLogger(messages: AiNodeMessage[]) {
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
      const nodeId = parsed?.result?.node?.id;

      if (!nodeId) {
        return;
      }

      const title =
        typeof parsed.result.node.title === "string" &&
        parsed.result.node.title.trim().length > 0
          ? parsed.result.node.title
          : "(untitled)";

      console.info(`[FILON AI] Created Node: ${nodeId} – ${title}`);
    } catch {
      // Not a JSON payload we care about
    }
  }, [messages]);
}

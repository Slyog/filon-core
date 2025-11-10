// Chooses the right agent depending on context: Cursor for code, Codex for logic.

type Agent =
  | { name: "Cursor"; type: "client" | "ai-dev" }
  | { name: "Codex"; type: "ai-logic" };

export async function getActiveAgent(): Promise<Agent> {
  if (typeof window !== "undefined") {
    return { name: "Cursor", type: "client" };
  }

  const env = process.env.FILON_AGENT ?? "codex";
  return env === "cursor"
    ? { name: "Cursor", type: "ai-dev" }
    : { name: "Codex", type: "ai-logic" };
}


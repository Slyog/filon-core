"use server";

import { createNode, linkNodes, summarizeSelection } from "@/server/graphActions";
import { getActiveAgent } from "@/server/agentRouter";

export async function graphToolchain(selection: string[]) {
  const agent = await getActiveAgent();

  console.info(`[FILON AI] Active agent: ${agent.name}`);

  const summary = await summarizeSelection(selection, agent);
  console.info("[FILON AI] Summary created:", summary);

  const node = await createNode({
    title: summary.title ?? "AI Summary Node",
    content: summary.text ?? "",
    tags: ["auto", "ai-summary"],
  });

  for (const id of selection) {
    await linkNodes(id, node.id);
  }

  return { summary, node };
}


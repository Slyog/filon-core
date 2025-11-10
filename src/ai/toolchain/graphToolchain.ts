import { summarizeSelection, createNode, linkNodes } from "@/lib/graphTools";

export async function runGraphToolchain(input: string) {
  const summary = await summarizeSelection(input);
  const node = await createNode({
    title: summary.title,
    content: summary.text,
  });
  const link = await linkNodes(summary.parentId, node.id);

  return { summary, node, link };
}

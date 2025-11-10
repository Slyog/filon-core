import { log } from "@/utils/logger";

export async function summarizeSelection(input: string) {
  return { title: input.slice(0, 20), text: input, parentId: "root" };
}

export async function createNode({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  const mode = process.env.FILON_QA_MODE;

  if (mode === "mock") {
    log.info("[QA MOCK] createNode mock engaged");
    return { id: "mock-node", title: "Mock Node", content };
  }

  if (mode === "mixed" && Math.random() > 0.5) {
    log.info("[QA MIXED] returning synthetic node");
    return { id: "half-node", title: "Mixed Node", content };
  }

  return { id: `node-${Math.random().toString(36).slice(2)}`, title, content };
}

export async function linkNodes(from: string, to: string) {
  return { id: `link-${Math.random().toString(36).slice(2)}`, from, to };
}

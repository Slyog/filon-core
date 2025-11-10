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
  return { id: `node-${Math.random().toString(36).slice(2)}`, title, content };
}

export async function linkNodes(from: string, to: string) {
  return { id: `link-${Math.random().toString(36).slice(2)}`, from, to };
}

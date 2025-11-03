import type { Node, Edge } from "reactflow";

/** Convert current graph to JSON string */
export function exportGraphJSON(nodes: Node[], edges: Edge[]) {
  const payload = {
    version: 1,
    nodes,
    edges,
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(payload, null, 2);
}

/** Download JSON as file */
export function downloadJSON(data: string, name = "filon-graph.json") {
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/** Parse imported file and return nodes/edges */
export async function importGraphJSON(file: File) {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data.nodes || !data.edges) throw new Error("Invalid graph file");
  return { nodes: data.nodes as Node[], edges: data.edges as Edge[] };
}

/** Export graph as Markdown (placeholder - can be extended with AI-structured formatting) */
export function exportGraphMarkdown(nodes: Node[], edges: Edge[]) {
  return nodes.map((n) => `- **${n.data?.label || "Untitled"}**`).join("\n");
}

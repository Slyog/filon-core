import type { Node, Edge } from "reactflow";
import { loadGraphFromSession } from "@/lib/sessionStorage";

export type ExportFormat = "json" | "markdown";

type SessionMeta = {
  nodeCount: number;
  edgeCount: number;
  lastSaved: number;
};

type SessionRecord = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  category?: string;
  meta?: SessionMeta;
};

function formatStamp(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${min}`;
}

async function getSessionById(sessionId: string): Promise<SessionRecord | null> {
  try {
    const { useSessionStore } = await import("@/store/SessionStore");
    const store = useSessionStore.getState();
    return store.sessions.find((session) => session.id === sessionId) ?? null;
  } catch (error) {
    throw new Error(
      "Session lookup unavailable. Ensure SessionStore exports useSessionStore."
    );
  }
}

function serializeJsonPayload(
  sessionId: string,
  generatedAt: Date,
  session: SessionRecord | null,
  nodes: Node[],
  edges: Edge[]
) {
  return {
    sessionId,
    generatedAt: generatedAt.toISOString(),
    session: session
      ? {
          id: session.id,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          category: session.category ?? null,
          meta: session.meta ?? null,
        }
      : null,
    nodes,
    edges,
  };
}

function serializeMarkdownPayload(
  sessionId: string,
  generatedAt: Date,
  session: SessionRecord | null,
  nodes: Node[],
  edges: Edge[]
): string {
  const lines: string[] = [];
  lines.push("# FILON Export");
  lines.push("");
  lines.push(`- Session ID: \`${sessionId}\``);
  lines.push(`- Generated At: ${generatedAt.toISOString()}`);
  lines.push(`- Nodes: ${nodes.length}`);
  lines.push(`- Edges: ${edges.length}`);

  if (session) {
    lines.push(`- Title: ${session.title}`);
    if (session.meta) {
      lines.push(
        `- Last Saved: ${new Date(session.meta.lastSaved).toISOString()}`
      );
    }
  }

  lines.push("");

  if (nodes.length > 0) {
    lines.push("## Nodes");
    lines.push("");
    lines.push("| id | type | label |");
    lines.push("| --- | --- | --- |");
    for (const node of nodes) {
      const label =
        typeof node.data === "object" && node.data && "label" in node.data
          ? String((node.data as Record<string, unknown>).label ?? "")
          : "";
      lines.push(
        `| ${node.id} | ${node.type ?? "default"} | ${label.replace(/\|/g, "\\|")} |`
      );
    }
    lines.push("");
  }

  if (edges.length > 0) {
    lines.push("## Edges");
    lines.push("");
    lines.push("| id | source | target |");
    lines.push("| --- | --- | --- |");
    for (const edge of edges) {
      lines.push(`| ${edge.id} | ${edge.source} | ${edge.target} |`);
    }
    lines.push("");
  }

  if (nodes.length === 0 && edges.length === 0) {
    lines.push("_No nodes or edges available in this export._");
    lines.push("");
  }

  return lines.join("\n");
}

export async function exportGraph(
  sessionId: string,
  format: ExportFormat
): Promise<{ filename: string; blob: Blob }> {
  try {
    if (!sessionId) {
      throw new Error("Invalid sessionId");
    }

    const generatedAt = new Date();
    const session = await getSessionById(sessionId);
    const { nodes = [], edges = [] } =
      (await loadGraphFromSession(sessionId)) ?? {};

    switch (format) {
      case "json": {
        const payload = serializeJsonPayload(
          sessionId,
          generatedAt,
          session,
          nodes,
          edges
        );
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json",
        });
        const filename = `filon-export-${sessionId}-${formatStamp(
          generatedAt
        )}.json`;
        return { filename, blob };
      }
      case "markdown": {
        const markdown = serializeMarkdownPayload(
          sessionId,
          generatedAt,
          session,
          nodes,
          edges
        );
        const blob = new Blob([markdown], { type: "text/markdown" });
        const filename = `filon-export-${sessionId}-${formatStamp(
          generatedAt
        )}.md`;
        return { filename, blob };
      }
      default: {
        const exhaustiveCheck: never = format;
        throw new Error(`Unsupported export format: ${exhaustiveCheck}`);
      }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : JSON.stringify(error);
    throw new Error(`Export failed: ${message}`);
  }
}

export { formatStamp };

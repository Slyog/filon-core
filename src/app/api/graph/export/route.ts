import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Node, Edge } from "reactflow";

type DbNode = {
  id: string;
  label: string;
  note: string | null;
  x: number;
  y: number;
};

type DbEdge = {
  id: string;
  sourceId: string;
  targetId: string;
};

export async function GET() {
  try {
    const [dbNodes, dbEdges]: [DbNode[], DbEdge[]] = await Promise.all([
      prisma.node.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.edge.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

    // Convert DB format to ReactFlow format
    const nodes: Node[] = dbNodes.map((n: DbNode) => ({
      id: n.id,
      position: { x: n.x, y: n.y },
      data: { label: n.label, note: n.note || "" },
      type: "default",
    }));

    const edges: Edge[] = dbEdges.map((e: DbEdge) => ({
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      type: "smoothstep",
      animated: true,
    }));

    return NextResponse.json({ nodes, edges });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export graph" },
      { status: 500 }
    );
  }
}


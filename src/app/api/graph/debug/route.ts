import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type NodeSummary = {
  id: string;
  label: string | null;
};

type EdgeSummary = {
  id: string;
  sourceId: string;
  targetId: string;
};

export async function GET() {
  try {
    const nodes = (await prisma.node.findMany({
      select: { id: true, label: true },
    })) as NodeSummary[];
    const edges = (await prisma.edge.findMany({
      select: { id: true, sourceId: true, targetId: true },
    })) as EdgeSummary[];

    return NextResponse.json({
      nodes: {
        count: nodes.length,
        ids: nodes.map((n: NodeSummary) => n.id),
        labels: nodes.map((n: NodeSummary) => n.label),
      },
      edges: {
        count: edges.length,
        ids: edges.map((e: EdgeSummary) => e.id),
      },
    });
  } catch (error: any) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 500 }
    );
  }
}

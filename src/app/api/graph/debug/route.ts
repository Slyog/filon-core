import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const nodes = await prisma.node.findMany({
      select: { id: true, label: true },
    });
    const edges = await prisma.edge.findMany({
      select: { id: true, sourceId: true, targetId: true },
    });

    return NextResponse.json({
      nodes: {
        count: nodes.length,
        ids: nodes.map((n) => n.id),
        labels: nodes.map((n) => n.label),
      },
      edges: {
        count: edges.length,
        ids: edges.map((e) => e.id),
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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Node, Edge } from "reactflow";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Support both ReactFlow format {nodes, edges} and direct DB format
    const nodes = Array.isArray(body.nodes) ? body.nodes : [];
    const edges = Array.isArray(body.edges) ? body.edges : [];

    // 🧹 Delete existing data
    await prisma.edge.deleteMany().catch(() => {});
    await prisma.node.deleteMany();

    // Check if data is in ReactFlow format or DB format
    const isReactFlowFormat =
      nodes.length > 0 && nodes[0]?.position !== undefined;

    if (isReactFlowFormat) {
      // Convert from ReactFlow format to DB format
      if (nodes.length > 0) {
        await prisma.node.createMany({
          data: nodes.map((n: Node) => ({
            id: n.id,
            label: n.data?.label || "Unnamed Node",
            note: n.data?.note || "",
            x: n.position?.x || 0,
            y: n.position?.y || 0,
          })),
        });
      }

      if (edges.length > 0) {
        await prisma.edge.createMany({
          data: edges.map((e: Edge) => ({
            id: e.id,
            sourceId: e.source,
            targetId: e.target,
          })),
        });
      }
    } else {
      // Assume DB format (direct Prisma format)
      if (nodes.length > 0) {
        await prisma.node.createMany({ data: nodes });
      }
      if (edges.length > 0) {
        await prisma.edge.createMany({ data: edges });
      }
    }

    // Update meta
    await prisma.meta.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        lastSavedAt: new Date(),
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
      update: {
        lastSavedAt: new Date(),
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
    });

    return NextResponse.json({ ok: true, count: nodes.length });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { ok: false, error: "Import failed" },
      { status: 500 }
    );
  }
}

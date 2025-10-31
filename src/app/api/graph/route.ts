import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Node, Edge } from "reactflow";

export async function GET() {
  try {
    const dbNodes = await prisma.node.findMany({
      orderBy: { createdAt: "asc" },
    });
    const dbEdges = await prisma.edge.findMany({
      orderBy: { createdAt: "asc" },
    });
    const meta = await prisma.meta.findUnique({ where: { id: 1 } });

    // Konvertiere DB-Format zu ReactFlow-Format
    const nodes: Node[] = dbNodes.map((n) => ({
      id: n.id,
      position: { x: n.x, y: n.y },
      data: { label: n.label, note: n.note || "" },
      type: "default",
    }));

    const edges: Edge[] = dbEdges.map((e) => ({
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      type: "smoothstep",
      animated: true,
    }));

    return NextResponse.json({ nodes, edges, meta }, { status: 200 });
  } catch (error) {
    console.error("Graph GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch graph" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nodes, edges }: { nodes: Node[]; edges: Edge[] } =
      await request.json();

    // Transaction: Alles oder nichts
    await prisma.$transaction(async (tx) => {
      // Alte Daten löschen
      await tx.edge.deleteMany();
      await tx.node.deleteMany();

      // Nodes speichern
      for (const node of nodes) {
        await tx.node.create({
          data: {
            id: node.id,
            label: node.data.label,
            note: node.data.note || "",
            x: node.position.x,
            y: node.position.y,
          },
        });
      }

      // Edges speichern
      for (const edge of edges) {
        await tx.edge.create({
          data: {
            id: edge.id,
            sourceId: edge.source,
            targetId: edge.target,
          },
        });
      }

      // Meta-Infos speichern
      await tx.meta.upsert({
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
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Graph POST error:", error);
    return NextResponse.json(
      { error: "Failed to save graph" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Node, Edge } from "reactflow";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

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

    return NextResponse.json(
      {
        nodes,
        edges,
        meta,
        automerge: meta?.automerge ? Array.from(meta.automerge) : [],
      },
      { status: 200 }
    );
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
    const body = await request.json();
    const nodes: Node[] = body.nodes || [];
    const edges: Edge[] = body.edges || [];
    const automerge = body.automerge;

    console.log("Saving Graph:", nodes.length, "nodes");

    console.log(
      "🧠 Saving graph with nodes:",
      nodes.length,
      "edges:",
      edges.length
    );
    console.log(
      "Node IDs:",
      nodes.map((n) => n.id)
    );

    // Transaction: Alles oder nichts (Array-Syntax für bessere Performance)
    await prisma.$transaction(async (tx) => {
      // Alte Daten löschen (Edges first due to foreign key constraints)
      await tx.edge.deleteMany();
      await tx.node.deleteMany();
      // Small delay to ensure deletes are committed
      await new Promise((r) => setTimeout(r, 10));

      // Nodes speichern (gemappt von ReactFlow-Format zu DB-Format)
      for (const node of nodes) {
        try {
          await tx.node.create({
            data: {
              id: node.id,
              label: node.data?.label || "Unnamed Node",
              note: node.data?.note || "",
              x: node.position?.x || 0,
              y: node.position?.y || 0,
            },
          });
        } catch (e) {
          if (
            e instanceof PrismaClientKnownRequestError &&
            e.code === "P2002"
          ) {
            console.warn("⚠️ Duplicate node ID skipped:", node.id);
          } else {
            throw e;
          }
        }
      }

      // Edges speichern (gemappt von ReactFlow-Format zu DB-Format)
      for (const edge of edges) {
        try {
          await tx.edge.create({
            data: {
              id: edge.id,
              sourceId: edge.source,
              targetId: edge.target,
            },
          });
        } catch (e) {
          if (
            e instanceof PrismaClientKnownRequestError &&
            e.code === "P2002"
          ) {
            console.warn("⚠️ Duplicate edge ID skipped:", edge.id);
          } else {
            throw e;
          }
        }
      }

      // Meta-Infos speichern
      const automergeBuffer = automerge ? Buffer.from(automerge) : null;
      await tx.meta.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          lastSavedAt: new Date(),
          nodeCount: nodes.length,
          edgeCount: edges.length,
          automerge: automergeBuffer,
        },
        update: {
          lastSavedAt: new Date(),
          nodeCount: nodes.length,
          edgeCount: edges.length,
          automerge: automergeBuffer,
        },
      });
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    console.error("Graph save failed:", error);

    if (error instanceof PrismaClientKnownRequestError) {
      console.error("❌ Prisma error:", error.code, error.meta, error.message);
    } else {
      console.error("❌ Graph save error:", error.code, error.message);
    }
    return NextResponse.json(
      {
        error: "Graph save failed",
        detail: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}

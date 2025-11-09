import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Node, Edge } from "reactflow";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";

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

type NormalizedNode = {
  id: string;
  label: string;
  note: string;
  x: number;
  y: number;
};

type NormalizedEdge = {
  id: string;
  sourceId: string;
  targetId: string;
};

function normalizeNodes(rawNodes: Node[] = []) {
  const records: NormalizedNode[] = [];
  const nodeIds = new Set<string>();
  const dropped: string[] = [];

  for (const node of rawNodes) {
    if (!node?.id) {
      continue;
    }

    const id = String(node.id);
    if (nodeIds.has(id)) {
      dropped.push(id);
      continue;
    }

    const x =
      typeof node.position?.x === "number" && Number.isFinite(node.position.x)
        ? node.position.x
        : 0;
    const y =
      typeof node.position?.y === "number" && Number.isFinite(node.position.y)
        ? node.position.y
        : 0;

    const rawLabel =
      (typeof node.data?.label === "string" && node.data.label.trim()) ||
      node.id?.toString() ||
      "Unnamed Node";
    const rawNote =
      typeof node.data?.note === "string" ? node.data.note : undefined;

    records.push({
      id,
      label: rawLabel.slice(0, 512),
      note: rawNote ? rawNote.slice(0, 2048) : "",
      x,
      y,
    });
    nodeIds.add(id);
  }

  return { records, nodeIds, dropped };
}

function normalizeEdges(rawEdges: Edge[] = [], nodeIds: Set<string>) {
  const records: NormalizedEdge[] = [];
  const seenEdgeIds = new Set<string>();
  const dropped: string[] = [];

  for (const edge of rawEdges) {
    if (!edge?.id || !edge.source || !edge.target) {
      if (edge?.id) dropped.push(String(edge.id));
      continue;
    }

    const id = String(edge.id);
    if (seenEdgeIds.has(id)) {
      dropped.push(id);
      continue;
    }

    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      dropped.push(id);
      continue;
    }

    records.push({
      id,
      sourceId: edge.source,
      targetId: edge.target,
    });
    seenEdgeIds.add(id);
  }

  return { records, dropped };
}

function toAutomergeBuffer(payload: unknown) {
  if (!payload) return null;
  if (payload instanceof Uint8Array) {
    return Buffer.from(payload);
  }
  if (Array.isArray(payload)) {
    return Buffer.from(Uint8Array.from(payload));
  }
  if (typeof payload === "string") {
    try {
      return Buffer.from(payload, "base64");
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET() {
  try {
    const dbNodes: DbNode[] = await prisma.node.findMany({
      orderBy: { createdAt: "asc" },
    });
    const dbEdges: DbEdge[] = await prisma.edge.findMany({
      orderBy: { createdAt: "asc" },
    });
    const meta = await prisma.meta.findUnique({ where: { id: 1 } });

    // Konvertiere DB-Format zu ReactFlow-Format
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
    const nodes: Node[] = Array.isArray(body.nodes) ? body.nodes : [];
    const edges: Edge[] = Array.isArray(body.edges) ? body.edges : [];
    const automerge = body.automerge;

    const { records: normalizedNodes, nodeIds, dropped: droppedNodeIds } =
      normalizeNodes(nodes);
    const { records: normalizedEdges, dropped: droppedEdgeIds } =
      normalizeEdges(edges, nodeIds);

    const automergeBuffer = toAutomergeBuffer(automerge);
    const operations: Prisma.PrismaPromise<unknown>[] = [
      prisma.edge.deleteMany(),
      prisma.node.deleteMany(),
    ];

    if (normalizedNodes.length > 0) {
      operations.push(
        prisma.node.createMany({
          data: normalizedNodes,
        })
      );
    }

    if (normalizedEdges.length > 0) {
      operations.push(
        prisma.edge.createMany({
          data: normalizedEdges,
        })
      );
    }

    operations.push(
      prisma.meta.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          lastSavedAt: new Date(),
          nodeCount: normalizedNodes.length,
          edgeCount: normalizedEdges.length,
          automerge: automergeBuffer,
        },
        update: {
          lastSavedAt: new Date(),
          nodeCount: normalizedNodes.length,
          edgeCount: normalizedEdges.length,
          automerge: automergeBuffer,
        },
      })
    );

    await prisma.$transaction(operations);

    if (droppedNodeIds.length || droppedEdgeIds.length) {
      console.warn("Graph save normalized payload", {
        droppedNodeIds,
        droppedEdgeIds,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        nodeCount: normalizedNodes.length,
        edgeCount: normalizedEdges.length,
        droppedNodeIds,
        droppedEdgeIds,
      },
      { status: 200 }
    );
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

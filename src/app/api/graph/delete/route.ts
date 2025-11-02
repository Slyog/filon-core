import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { nodeId } = await request.json();
    if (!nodeId) {
      return NextResponse.json(
        { ok: false, error: "Missing nodeId" },
        { status: 400 }
      );
    }

    // Delete connected edges first
    await prisma.edge.deleteMany({
      where: {
        OR: [
          { sourceId: nodeId },
          { targetId: nodeId },
        ],
      },
    });

    // Delete node
    await prisma.node.delete({ where: { id: nodeId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { ok: false, error: "Delete failed" },
      { status: 500 }
    );
  }
}


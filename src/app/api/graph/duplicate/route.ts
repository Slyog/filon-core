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

    const node = await prisma.node.findUnique({ where: { id: nodeId } });
    if (!node) {
      return NextResponse.json(
        { ok: false, error: "Node not found" },
        { status: 404 }
      );
    }

    // Create duplicate with offset position
    const duplicate = await prisma.node.create({
      data: {
        label: `${node.label} (copy)`,
        note: node.note || "",
        x: node.x + 40,
        y: node.y + 40,
      },
    });

    return NextResponse.json({ ok: true, duplicate });
  } catch (error) {
    console.error("Duplicate error:", error);
    return NextResponse.json(
      { ok: false, error: "Duplication failed" },
      { status: 500 }
    );
  }
}

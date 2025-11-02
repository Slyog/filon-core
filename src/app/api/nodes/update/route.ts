import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { id, label, note } = await request.json();
    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing node id" },
        { status: 400 }
      );
    }

    await prisma.node.update({
      where: { id },
      data: {
        label: label !== undefined ? label : undefined,
        note: note !== undefined ? note : undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update node error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to update node" },
      { status: 500 }
    );
  }
}

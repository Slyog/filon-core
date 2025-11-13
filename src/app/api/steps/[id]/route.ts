import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateStepSchema = z.object({
  title: z.string().min(1).optional(),
  detail: z.string().optional(),
  difficulty: z.number().int().min(1).max(10).optional(),
  timeEstimate: z.number().int().min(1).optional(),
  dependencies: z.array(z.string()).optional(),
  state: z.enum(["todo", "active", "done"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateStepSchema.parse(body);

    const step = await prisma.step.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.detail !== undefined && { detail: data.detail }),
        ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
        ...(data.timeEstimate !== undefined && {
          timeEstimate: data.timeEstimate,
        }),
        ...(data.dependencies !== undefined && {
          dependencies: data.dependencies,
        }),
        ...(data.state && { state: data.state }),
      },
      include: {
        track: true,
        actions: true,
      },
    });

    return NextResponse.json({ step }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Step PATCH error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Step not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update step" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Manual cascade: delete related actions
    const step = await prisma.step.findUnique({
      where: { id },
      include: {
        actions: true,
      },
    });

    if (!step) {
      return NextResponse.json(
        { error: "Step not found" },
        { status: 404 }
      );
    }

    // Delete all actions
    await prisma.action.deleteMany({
      where: { stepId: step.id },
    });
    // Delete step
    await prisma.step.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Step DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete step" },
      { status: 500 }
    );
  }
}


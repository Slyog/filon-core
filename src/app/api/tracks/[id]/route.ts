import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTrackSchema = z.object({
  type: z.enum(["learn", "build", "ship", "business"]).optional(),
  score: z.number().int().optional(),
  aiReasoning: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateTrackSchema.parse(body);

    const track = await prisma.track.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.score !== undefined && { score: data.score }),
        ...(data.aiReasoning !== undefined && { aiReasoning: data.aiReasoning }),
      },
      include: {
        goal: true,
        steps: {
          include: {
            actions: true,
          },
        },
      },
    });

    return NextResponse.json({ track }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Track PATCH error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Track not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update track" },
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
    // Manual cascade: delete related steps and actions
    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        steps: {
          include: {
            actions: true,
          },
        },
      },
    });

    if (!track) {
      return NextResponse.json(
        { error: "Track not found" },
        { status: 404 }
      );
    }

    // Delete all actions
    for (const step of track.steps) {
      await prisma.action.deleteMany({
        where: { stepId: step.id },
      });
    }
    // Delete all steps
    await prisma.step.deleteMany({
      where: { trackId: track.id },
    });
    // Delete track
    await prisma.track.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Track DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete track" },
      { status: 500 }
    );
  }
}


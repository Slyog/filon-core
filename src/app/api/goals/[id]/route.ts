import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

// Prisma JSON type helper
type PrismaJsonValue = Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined;

const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  userProfileSnapshot: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const goal = await prisma.goal.findUnique({
      where: { id },
      include: {
        tracks: {
          include: {
            steps: {
              include: {
                actions: true,
              },
            },
          },
        },
        journeyState: true,
        scores: true,
      },
    });

    if (!goal) {
      return NextResponse.json(
        { error: "Goal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ goal }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Goal GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch goal" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateGoalSchema.parse(body);

    const goal = await prisma.goal.update({
      where: { id },
          data: {
            ...(data.title && { title: data.title }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.userProfileSnapshot !== undefined && {
              userProfileSnapshot: data.userProfileSnapshot as PrismaJsonValue,
            }),
          },
      include: {
        tracks: true,
        journeyState: true,
        scores: true,
      },
    });

    return NextResponse.json({ goal }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Goal PATCH error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Goal not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update goal" },
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
    // Manual cascade: delete related records
    const goal = await prisma.goal.findUnique({
      where: { id },
      include: {
        tracks: {
          include: {
            steps: {
              include: {
                actions: true,
              },
            },
          },
        },
        journeyState: true,
        scores: true,
      },
    });

    if (!goal) {
      return NextResponse.json(
        { error: "Goal not found" },
        { status: 404 }
      );
    }

    // Delete all actions
    for (const track of goal.tracks) {
      for (const step of track.steps) {
        await prisma.action.deleteMany({
          where: { stepId: step.id },
        });
      }
      // Delete all steps
      await prisma.step.deleteMany({
        where: { trackId: track.id },
      });
    }
    // Delete all tracks
    await prisma.track.deleteMany({
      where: { goalId: goal.id },
    });
    // Delete journey state
    if (goal.journeyState) {
      await prisma.journeyState.delete({
        where: { id: goal.journeyState.id },
      });
    }
    // Delete scores
    await prisma.score.deleteMany({
      where: { goalId: goal.id },
    });
    // Delete goal
    await prisma.goal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Goal DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}


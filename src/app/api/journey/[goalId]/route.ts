import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateJourneyStateSchema = z.object({
  activeStepId: z.string().optional().nullable(),
  nextSuggestion: z.string().optional().nullable(),
  stuckReason: z.string().optional().nullable(),
  progress: z.number().int().min(0).max(100).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const { goalId } = await params;
    const journeyState = await prisma.journeyState.findFirst({
      where: { goalId },
      include: {
        goal: {
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
          },
        },
      },
    });

    if (!journeyState) {
      // Create initial journey state if it doesn't exist
      const newJourneyState = await prisma.journeyState.create({
        data: {
          goalId,
          progress: 0,
        },
        include: {
          goal: {
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
            },
          },
        },
      });
      return NextResponse.json({ journeyState: newJourneyState }, { status: 200 });
    }

    return NextResponse.json({ journeyState }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Journey GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch journey state" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const { goalId } = await params;
    const body = await request.json();
    const data = updateJourneyStateSchema.parse(body);

    // Check if journey state exists
    let journeyState = await prisma.journeyState.findFirst({
      where: { goalId },
    });

    if (!journeyState) {
      // Create if it doesn't exist
      journeyState = await prisma.journeyState.create({
        data: {
          goalId,
          progress: data.progress ?? 0,
          activeStepId: data.activeStepId ?? null,
          nextSuggestion: data.nextSuggestion ?? null,
          stuckReason: data.stuckReason ?? null,
        },
      });
    } else {
      // Update existing
      journeyState = await prisma.journeyState.update({
        where: { id: journeyState.id },
        data: {
          ...(data.activeStepId !== undefined && {
            activeStepId: data.activeStepId,
          }),
          ...(data.nextSuggestion !== undefined && {
            nextSuggestion: data.nextSuggestion,
          }),
          ...(data.stuckReason !== undefined && {
            stuckReason: data.stuckReason,
          }),
          ...(data.progress !== undefined && { progress: data.progress }),
        },
      });
    }

    return NextResponse.json({ journeyState }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Journey PATCH error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update journey state" },
      { status: 500 }
    );
  }
}


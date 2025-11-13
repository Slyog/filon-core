import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTrackSchema = z.object({
  goalId: z.string().min(1),
  type: z.enum(["learn", "build", "ship", "business"]),
  score: z.number().int().default(0),
  aiReasoning: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createTrackSchema.parse(body);

    // Verify goal exists
    const goal = await prisma.goal.findUnique({
      where: { id: data.goalId },
    });

    if (!goal) {
      return NextResponse.json(
        { error: "Goal not found" },
        { status: 404 }
      );
    }

    const track = await prisma.track.create({
      data: {
        goalId: data.goalId,
        type: data.type,
        score: data.score,
        aiReasoning: data.aiReasoning,
      },
      include: {
        goal: true,
        steps: true,
      },
    });

    return NextResponse.json({ track }, { status: 201 });
  } catch (error: any) {
    console.error("[API] Tracks POST error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create track" },
      { status: 500 }
    );
  }
}


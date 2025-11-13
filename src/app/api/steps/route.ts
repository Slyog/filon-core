import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createStepSchema = z.object({
  trackId: z.string().min(1),
  title: z.string().min(1),
  detail: z.string().optional(),
  difficulty: z.number().int().min(1).max(10).default(1),
  timeEstimate: z.number().int().min(1).default(15),
  dependencies: z.array(z.string()).default([]),
  state: z.enum(["todo", "active", "done"]).default("todo"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createStepSchema.parse(body);

    // Verify track exists
    const track = await prisma.track.findUnique({
      where: { id: data.trackId },
    });

    if (!track) {
      return NextResponse.json(
        { error: "Track not found" },
        { status: 404 }
      );
    }

    const step = await prisma.step.create({
      data: {
        trackId: data.trackId,
        title: data.title,
        detail: data.detail,
        difficulty: data.difficulty,
        timeEstimate: data.timeEstimate,
        dependencies: data.dependencies,
        state: data.state,
      },
      include: {
        track: true,
        actions: true,
      },
    });

    return NextResponse.json({ step }, { status: 201 });
  } catch (error: any) {
    console.error("[API] Steps POST error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create step" },
      { status: 500 }
    );
  }
}


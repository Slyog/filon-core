import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

// Prisma JSON type helper
type PrismaJsonValue = Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined;

const createGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  userProfileSnapshot: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  try {
    const goals = await prisma.goal.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ goals }, { status: 200 });
  } catch (error: any) {
    console.error("[API] Goals GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createGoalSchema.parse(body);

        const goal = await prisma.goal.create({
          data: {
            title: data.title,
            description: data.description,
            userProfileSnapshot: data.userProfileSnapshot as PrismaJsonValue,
          },
      include: {
        tracks: true,
        journeyState: true,
        scores: true,
      },
    });

    // Create initial journey state
    await prisma.journeyState.create({
      data: {
        goalId: goal.id,
        progress: 0,
      },
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error: any) {
    console.error("[API] Goals POST error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}


import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { TrackType, StepState } from "@/types/filon";
import type { Prisma } from "@prisma/client";

export interface StepEngineResult {
  success: boolean;
  message: string;
  data?: unknown;
}

const createGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  userProfileSnapshot: z.record(z.string(), z.unknown()).optional(),
});

const createTrackSchema = z.object({
  goalId: z.string().min(1),
  type: z.enum(["learn", "build", "ship", "business"]),
  score: z.number().int().default(0),
  aiReasoning: z.string().optional(),
});

const createStepSchema = z.object({
  trackId: z.string().min(1),
  title: z.string().min(1),
  detail: z.string().optional(),
  difficulty: z.number().int().min(1).max(10).default(1),
  timeEstimate: z.number().int().min(1).default(15),
  dependencies: z.array(z.string()).default([]),
  state: z.enum(["todo", "active", "done"]).default("todo"),
});

const updateStepSchema = z.object({
  stepId: z.string().min(1),
  title: z.string().min(1).optional(),
  detail: z.string().optional(),
  difficulty: z.number().int().min(1).max(10).optional(),
  timeEstimate: z.number().int().min(1).optional(),
  dependencies: z.array(z.string()).optional(),
  state: z.enum(["todo", "active", "done"]).optional(),
});

const updateJourneyStateSchema = z.object({
  goalId: z.string().min(1),
  activeStepId: z.string().optional().nullable(),
  nextSuggestion: z.string().optional().nullable(),
  stuckReason: z.string().optional().nullable(),
  progress: z.number().int().min(0).max(100).optional(),
});

export async function createGoal(
  data: z.infer<typeof createGoalSchema>
): Promise<StepEngineResult> {
  try {
    const validated = createGoalSchema.parse(data);

    const goal = await prisma.goal.create({
      data: {
        title: validated.title,
        description: validated.description,
        userProfileSnapshot: validated.userProfileSnapshot as Prisma.InputJsonValue | undefined,
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

    return {
      success: true,
      message: "Goal created successfully",
      data: goal,
    };
  } catch (error: any) {
    console.error("[StepEngine] createGoal error:", error);
    return {
      success: false,
      message: error.message || "Failed to create goal",
    };
  }
}

export async function generateTracks(
  goalId: string,
  trackTypes: TrackType[] = ["learn", "build", "ship", "business"]
): Promise<StepEngineResult> {
  try {
    // Verify goal exists
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      return {
        success: false,
        message: "Goal not found",
      };
    }

    const tracks = await Promise.all(
      trackTypes.map((type) =>
        prisma.track.create({
          data: {
            goalId,
            type,
            score: 0,
          },
          include: {
            steps: true,
          },
        })
      )
    );

    return {
      success: true,
      message: "Tracks generated successfully",
      data: tracks,
    };
  } catch (error: any) {
    console.error("[StepEngine] generateTracks error:", error);
    return {
      success: false,
      message: error.message || "Failed to generate tracks",
    };
  }
}

export async function generateSteps(
  trackId: string,
  steps: Array<{
    title: string;
    detail?: string;
    difficulty?: number;
    timeEstimate?: number;
    dependencies?: string[];
  }>
): Promise<StepEngineResult> {
  try {
    // Verify track exists
    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      return {
        success: false,
        message: "Track not found",
      };
    }

    const createdSteps = await Promise.all(
      steps.map((step) =>
        prisma.step.create({
          data: {
            trackId,
            title: step.title,
            detail: step.detail,
            difficulty: step.difficulty ?? 1,
            timeEstimate: step.timeEstimate ?? 15,
            dependencies: step.dependencies ?? [],
            state: "todo",
          },
          include: {
            actions: true,
          },
        })
      )
    );

    return {
      success: true,
      message: "Steps generated successfully",
      data: createdSteps,
    };
  } catch (error: any) {
    console.error("[StepEngine] generateSteps error:", error);
    return {
      success: false,
      message: error.message || "Failed to generate steps",
    };
  }
}

export async function updateStep(
  data: z.infer<typeof updateStepSchema>
): Promise<StepEngineResult> {
  try {
    const validated = updateStepSchema.parse(data);

    const step = await prisma.step.update({
      where: { id: validated.stepId },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.detail !== undefined && { detail: validated.detail }),
        ...(validated.difficulty !== undefined && {
          difficulty: validated.difficulty,
        }),
        ...(validated.timeEstimate !== undefined && {
          timeEstimate: validated.timeEstimate,
        }),
        ...(validated.dependencies !== undefined && {
          dependencies: validated.dependencies,
        }),
        ...(validated.state && { state: validated.state }),
      },
      include: {
        track: true,
        actions: true,
      },
    });

    return {
      success: true,
      message: "Step updated successfully",
      data: step,
    };
  } catch (error: any) {
    console.error("[StepEngine] updateStep error:", error);
    return {
      success: false,
      message: error.message || "Failed to update step",
    };
  }
}

export async function updateJourneyState(
  data: z.infer<typeof updateJourneyStateSchema>
): Promise<StepEngineResult> {
  try {
    const validated = updateJourneyStateSchema.parse(data);

    // Check if journey state exists
    let journeyState = await prisma.journeyState.findFirst({
      where: { goalId: validated.goalId },
    });

    if (!journeyState) {
      // Create if it doesn't exist
      journeyState = await prisma.journeyState.create({
        data: {
          goalId: validated.goalId,
          progress: validated.progress ?? 0,
          activeStepId: validated.activeStepId ?? null,
          nextSuggestion: validated.nextSuggestion ?? null,
          stuckReason: validated.stuckReason ?? null,
        },
      });
    } else {
      // Update existing
      journeyState = await prisma.journeyState.update({
        where: { id: journeyState.id },
        data: {
          ...(validated.activeStepId !== undefined && {
            activeStepId: validated.activeStepId,
          }),
          ...(validated.nextSuggestion !== undefined && {
            nextSuggestion: validated.nextSuggestion,
          }),
          ...(validated.stuckReason !== undefined && {
            stuckReason: validated.stuckReason,
          }),
          ...(validated.progress !== undefined && {
            progress: validated.progress,
          }),
        },
      });
    }

    return {
      success: true,
      message: "Journey state updated successfully",
      data: journeyState,
    };
  } catch (error: any) {
    console.error("[StepEngine] updateJourneyState error:", error);
    return {
      success: false,
      message: error.message || "Failed to update journey state",
    };
  }
}

export async function runStepEngineToolchain(
  command: string,
  payload: unknown
): Promise<StepEngineResult> {
  try {
    switch (command) {
      case "createGoal":
        return await createGoal(payload as z.infer<typeof createGoalSchema>);
      case "generateTracks":
        const { goalId, trackTypes } = payload as {
          goalId: string;
          trackTypes?: TrackType[];
        };
        return await generateTracks(goalId, trackTypes);
      case "generateSteps":
        const { trackId, steps } = payload as {
          trackId: string;
          steps: Array<{
            title: string;
            detail?: string;
            difficulty?: number;
            timeEstimate?: number;
            dependencies?: string[];
          }>;
        };
        return await generateSteps(trackId, steps);
      case "updateStep":
        return await updateStep(payload as z.infer<typeof updateStepSchema>);
      case "updateJourneyState":
        return await updateJourneyState(
          payload as z.infer<typeof updateJourneyStateSchema>
        );
      default:
        return {
          success: false,
          message: `Unknown command: ${command}`,
        };
    }
  } catch (error: any) {
    console.error("[StepEngine] runStepEngineToolchain error:", error);
    return {
      success: false,
      message: error.message || "Failed to run step engine toolchain",
    };
  }
}


// FILON v4: Export utility updated for goal-based structure
import type { Goal } from "@/types/filon";

export type ExportFormat = "json" | "markdown";

function formatStamp(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${min}`;
}

async function getGoalById(goalId: string): Promise<Goal | null> {
  try {
    const response = await fetch(`/api/goals/${goalId}`);
    if (!response.ok) {
      return null;
    }
    const { goal } = await response.json();
    return goal;
  } catch (error) {
    console.error("Failed to fetch goal:", error);
    return null;
  }
}

function serializeJsonPayload(
  sessionId: string,
  generatedAt: Date,
  goal: Goal | null
) {
  return {
    sessionId,
    generatedAt: generatedAt.toISOString(),
    goal,
  };
}

function serializeMarkdownPayload(
  sessionId: string,
  generatedAt: Date,
  goal: Goal | null
): string {
  const lines: string[] = [];
  lines.push("# FILON Export");
  lines.push("");
  lines.push(`- Session ID: \`${sessionId}\``);
  lines.push(`- Generated At: ${generatedAt.toISOString()}`);

  if (goal) {
    lines.push(`- Goal ID: \`${goal.id}\``);
    lines.push(`- Goal Title: ${goal.title}`);
    if (goal.description) {
      lines.push(`- Description: ${goal.description}`);
    }
    if (goal.tracks && goal.tracks.length > 0) {
      lines.push(`- Tracks: ${goal.tracks.length}`);
    }
  }

  lines.push("");

  if (goal) {
    lines.push("## Goal");
    lines.push("");
    lines.push(`**${goal.title}**`);
    if (goal.description) {
      lines.push("");
      lines.push(goal.description);
    }

    if (goal.tracks && goal.tracks.length > 0) {
      lines.push("");
      lines.push("## Tracks");
      lines.push("");
      for (const track of goal.tracks) {
        lines.push(`### ${track.type}`);
        if (track.aiReasoning) {
          lines.push(track.aiReasoning);
        }
        if (track.steps && track.steps.length > 0) {
          lines.push("");
          lines.push("#### Steps");
          for (const step of track.steps) {
            lines.push(`- [${step.state === "done" ? "x" : " "}] ${step.title}`);
            if (step.detail) {
              lines.push(`  ${step.detail}`);
            }
          }
        }
        lines.push("");
      }
    }
  } else {
    lines.push("_No goal available in this export._");
    lines.push("");
  }

  return lines.join("\n");
}

export async function exportGraph(
  sessionId: string,
  format: ExportFormat
): Promise<{ filename: string; blob: Blob }> {
  try {
    if (!sessionId) {
      throw new Error("Invalid sessionId");
    }

    const generatedAt = new Date();
    // Use sessionId as goalId for now (FILON v4 uses goals instead of sessions)
    const goal = await getGoalById(sessionId);

    switch (format) {
      case "json": {
        const payload = serializeJsonPayload(
          sessionId,
          generatedAt,
          goal
        );
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json",
        });
        const filename = `filon-export-${sessionId}-${formatStamp(
          generatedAt
        )}.json`;
        return { filename, blob };
      }
      case "markdown": {
        const markdown = serializeMarkdownPayload(
          sessionId,
          generatedAt,
          goal
        );
        const blob = new Blob([markdown], { type: "text/markdown" });
        const filename = `filon-export-${sessionId}-${formatStamp(
          generatedAt
        )}.md`;
        return { filename, blob };
      }
      default: {
        const exhaustiveCheck: never = format;
        throw new Error(`Unsupported export format: ${exhaustiveCheck}`);
      }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : JSON.stringify(error);
    throw new Error(`Export failed: ${message}`);
  }
}

export { formatStamp };

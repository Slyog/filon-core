import type { DiffResult } from "./diffEngine";

/**
 * Generates a human-readable summary of graph changes
 * @param diff - Diff result containing all detected changes
 * @returns A concise text description of the changes
 */
export async function generateSnapshotSummary(diff: DiffResult): Promise<string> {
  try {
    const addedCount = diff.addedNodes.length;
    const removedCount = diff.removedNodes.length;
    const changedCount = diff.changedNodes.length;
    const addedEdgeCount = diff.addedEdges.length;
    const removedEdgeCount = diff.removedEdges.length;

    const parts: string[] = [];

    // Add node changes
    if (addedCount > 0) {
      parts.push(`${addedCount} new ${addedCount === 1 ? "idea" : "ideas"} added`);
    }
    if (removedCount > 0) {
      parts.push(`${removedCount} ${removedCount === 1 ? "idea removed" : "ideas removed"}`);
    }
    if (changedCount > 0) {
      parts.push(`${changedCount} ${changedCount === 1 ? "concept updated" : "concepts updated"}`);
    }

    // Add edge changes (optional, less verbose)
    if (addedEdgeCount > 0 || removedEdgeCount > 0) {
      const edgeDelta = addedEdgeCount - removedEdgeCount;
      if (edgeDelta > 0) {
        parts.push(`${Math.abs(edgeDelta)} new ${edgeDelta === 1 ? "connection" : "connections"}`);
      } else if (edgeDelta < 0) {
        parts.push(`${Math.abs(edgeDelta)} ${edgeDelta === -1 ? "connection removed" : "connections removed"}`);
      } else {
        // Equal add/remove
        parts.push("connections restructured");
      }
    }

    // Fallback if no changes detected
    if (parts.length === 0) {
      return "No significant changes detected";
    }

    // Join parts with commas, add period at end
    return parts.join(", ") + ".";
  } catch (err) {
    console.warn("AI Summary generation failed:", err);
    return "Unable to generate summary";
  }
}

/**
 * Future placeholder for AI-powered summarization
 * This will integrate with OpenAI API or local LLM for contextual analysis
 * @param diff - Diff result
 * @param graphState - Current graph state for context
 * @returns AI-generated contextual summary
 */
export async function generateAIContextualSummary(
  diff: DiffResult,
  graphState: { nodes: any[]; edges: any[] }
): Promise<string> {
  // TODO: Implement AI integration in future version
  // Example approach:
  // 1. Send diff to OpenAI API or local LLM
  // 2. Include graph context (node types, labels, structure)
  // 3. Request natural language explanation
  // 4. Return contextual insights
  
  console.log("🤖 AI contextual summarization (planned for future version)");
  console.log("Graph context:", {
    totalNodes: graphState.nodes.length,
    totalEdges: graphState.edges.length,
    changes: {
      added: diff.addedNodes.length,
      removed: diff.removedNodes.length,
      changed: diff.changedNodes.length,
    },
  });

  // For now, use basic summary
  return await generateSnapshotSummary(diff);
}


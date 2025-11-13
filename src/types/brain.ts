/**
 * FILON v4 Brainbar Types
 * Compatibility layer for goal-based commands
 */

export type BrainCommandType = "goal";

export interface BrainCommand {
  type: BrainCommandType;
  text: string;
}

export interface BrainError {
  code: "empty_input" | "duplicate";
  message: string;
  value?: string;
}

// Legacy types - to be removed after full migration
export interface BrainNode {
  id: string;
  text: string;
  intent: BrainCommandType;
  createdAt: number;
  sessionId?: string;
}

export interface StreamEntry {
  id: string;
  nodeId: string;
  text: string;
  intent: BrainCommandType;
  createdAt: number;
}


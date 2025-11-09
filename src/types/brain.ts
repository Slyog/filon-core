"use client";

export type BrainCommandType = "add" | "link" | "goal" | "due";

export interface BrainCommand {
  type: BrainCommandType;
  text: string;
}

export interface BrainNode {
  id: string;
  text: string;
  intent: BrainCommandType;
  createdAt: number;
  sessionId?: string;
}

export interface BrainError {
  code: "empty_input" | "duplicate";
  message: string;
  value?: string;
}

export interface StreamEntry {
  id: string;
  nodeId: string;
  text: string;
  intent: BrainCommandType;
  createdAt: number;
}


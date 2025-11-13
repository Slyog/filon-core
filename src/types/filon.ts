/**
 * FILON v4 Core Data Model Types
 * 
 * Goal → Tracks → Steps → Actions → Scoring → Progress
 */

export type TrackType = "learn" | "build" | "ship" | "business";

export type StepState = "todo" | "active" | "done";

export type ScoreTarget = "goal" | "track" | "step";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  userProfileSnapshot?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  tracks?: Track[];
  journeyState?: JourneyState;
}

export interface Track {
  id: string;
  goalId: string;
  goal?: Goal;
  type: TrackType;
  score: number;
  aiReasoning?: string;
  createdAt: Date;
  steps?: Step[];
  scores?: Score[];
}

export interface Step {
  id: string;
  trackId: string;
  track?: Track;
  title: string;
  detail?: string;
  difficulty: number;
  timeEstimate: number;
  dependencies: string[]; // Stored as Json in DB, but typed as string[] in code
  state: StepState;
  createdAt: Date;
  actions?: Action[];
  scores?: Score[];
}

export interface Action {
  id: string;
  stepId: string;
  step?: Step;
  title: string;
  done: boolean;
}

export interface Score {
  id: string;
  targetType: ScoreTarget;
  targetId: string;
  realism: number;
  clarity: number;
  userFit: number;
  marketReality: number;
  overallScore: number;
  createdAt: Date;
  goalId?: string;
  goal?: Goal;
}

export interface JourneyState {
  id: string;
  goalId: string;
  goal?: Goal;
  activeStepId?: string;
  nextSuggestion?: string;
  stuckReason?: string;
  progress: number;
  updatedAt: Date;
}


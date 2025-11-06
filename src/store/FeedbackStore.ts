"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FeedbackType =
  | "ai_explain"
  | "ai_summary"
  | "sync_success"
  | "sync_failed"
  | "node_added"
  | "snapshot_created"
  | "user_action";

export interface FeedbackEvent {
  id: string;
  type: FeedbackType;
  payload: any;
  timestamp: number;
  score?: number; // -1 to 1 (thumbs down to thumbs up)
  comment?: string;
  insight?: string; // AI-generated insight
  nodeId?: string;
  message?: string;
  confidence?: number;
}

export interface FeedbackInsight {
  id: string;
  type: FeedbackType;
  summary: string;
  confidence: number;
  createdAt: number;
}

interface FeedbackState {
  events: FeedbackEvent[];
  insights: FeedbackInsight[];
  score: number; // Overall feedback score (-1 to 1)
  addFeedback: (event: Omit<FeedbackEvent, "id" | "timestamp">) => void;
  getFeedbackByType: (type: FeedbackType) => FeedbackEvent[];
  computeScore: () => number;
  addInsight: (insight: Omit<FeedbackInsight, "id" | "createdAt">) => void;
  clearFeedback: () => void;
}

export const useFeedbackStore = create<FeedbackState>()(
  persist(
    (set, get) => ({
      events: [],
      insights: [],
      score: 0,

      addFeedback: (event) => {
        const payloadMessage =
          typeof event.payload?.message === "string"
            ? event.payload.message
            : typeof event.payload === "string"
            ? event.payload
            : undefined;
        const payloadNodeId =
          typeof event.payload?.nodeId === "string"
            ? event.payload.nodeId
            : undefined;
        const payloadConfidence =
          typeof event.payload?.confidence === "number"
            ? event.payload.confidence
            : undefined;

        const newEvent: FeedbackEvent = {
          ...event,
          nodeId: event.nodeId ?? payloadNodeId,
          message: event.message ?? payloadMessage,
          confidence: event.confidence ?? payloadConfidence,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };

        set((state) => {
          const updatedEvents = [...state.events, newEvent];
          // Recalculate overall score
          const scores = updatedEvents
            .map((e) => e.score ?? 0)
            .filter((s) => s !== 0);
          const avgScore =
            scores.length > 0
              ? scores.reduce((a, b) => a + b, 0) / scores.length
              : 0;

          // Generate insight for negative feedback
          let newInsights = [...state.insights];
          if (event.score !== undefined && event.score < 0) {
            const insight: FeedbackInsight = {
              id: `${Date.now()}-insight`,
              type: event.type,
              summary: `Negative feedback detected for ${event.type}. Consider reviewing user experience.`,
              confidence: 0.8,
              createdAt: Date.now(),
            };
            newInsights.push(insight);
          }

          return {
            events: updatedEvents,
            insights: newInsights,
            score: avgScore,
          };
        });

        console.log(`[FEEDBACK] Event added: ${event.type}`, newEvent);
      },

      getFeedbackByType: (type) => {
        return get().events.filter((e) => e.type === type);
      },

      computeScore: () => {
        const state = get();
        const scores = state.events
          .map((e) => e.score ?? 0)
          .filter((s) => s !== 0);
        return scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;
      },

      addInsight: (insight) => {
        const newInsight: FeedbackInsight = {
          ...insight,
          id: `${Date.now()}-insight-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          createdAt: Date.now(),
        };

        set((state) => ({
          insights: [...state.insights, newInsight],
        }));

        console.log(`[FEEDBACK] Insight added: ${insight.type}`, newInsight);
      },

      clearFeedback: () => {
        set({ events: [], insights: [], score: 0 });
      },
    }),
    {
      name: "filon-feedback-storage",
    }
  )
);

// TODO: Sync feedback to Cloud (Dynamo)
// TODO: Aggregate feedback metrics for UI Coach

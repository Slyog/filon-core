"use client";

import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import localforage from "localforage";
import type { Goal, Track, Step } from "@/types/filon";

export interface GoalError {
  code: "empty_input" | "duplicate" | "api_error";
  message: string;
  value?: string;
}

type GoalState = {
  goals: Goal[];
  currentGoal: Goal | null;
  activeStepId: string | null;
  hydrated: boolean;
  lastError: GoalError | null;
  createGoal: (title: string, description?: string) => Promise<
    | { ok: true; goal: Goal }
    | { ok: false; error: GoalError }
  >;
  setCurrentGoal: (goal: Goal | null) => void;
  setActiveStep: (stepId: string | null) => void;
  clearError: () => void;
  markHydrated: () => void;
  loadGoals: () => Promise<void>;
};

type PersistedGoalState = Pick<GoalState, "goals" | "currentGoal" | "activeStepId">;

const GOAL_STORAGE_KEY = "filon.goal.state";

const goalStorage: PersistStorage<PersistedGoalState> = {
  getItem: async (name) => {
    const stored = await localforage.getItem<{
      state: PersistedGoalState;
      version?: number;
    }>(name);
    if (!stored) return null;
    return {
      state: stored.state,
      version: stored.version ?? 0,
    };
  },
  setItem: async (name, value) => {
    await localforage.setItem(name, value);
  },
  removeItem: (name) => localforage.removeItem(name),
};

export const useGoalState = create<GoalState>()(
  persist(
    (set, get) => ({
      goals: [],
      currentGoal: null,
      activeStepId: null,
      hydrated: typeof window === "undefined" ? true : false,
      lastError: null,
      createGoal: async (title, description) => {
        const trimmed = title.trim();
        if (!trimmed) {
          const error: GoalError = {
            code: "empty_input",
            message: "Please enter a goal title before submitting.",
          };
          set({ lastError: error });
          return { ok: false, error };
        }

        try {
          const response = await fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: trimmed,
              description: description?.trim(),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error: GoalError = {
              code: "api_error",
              message: errorData.error || "Failed to create goal",
            };
            set({ lastError: error });
            return { ok: false, error };
          }

          const { goal } = await response.json();
          set((state) => ({
            goals: [goal, ...state.goals],
            currentGoal: goal,
            lastError: null,
          }));

          return { ok: true, goal };
        } catch (error: any) {
          const goalError: GoalError = {
            code: "api_error",
            message: error.message || "Failed to create goal",
          };
          set({ lastError: goalError });
          return { ok: false, error: goalError };
        }
      },
      setCurrentGoal: (goal) => {
        set({ currentGoal: goal });
      },
      setActiveStep: (stepId) => {
        set({ activeStepId: stepId });
      },
      clearError: () => {
        set({ lastError: null });
      },
      markHydrated: () => {
        set({ hydrated: true });
      },
      loadGoals: async () => {
        try {
          const response = await fetch("/api/goals");
          if (!response.ok) {
            console.error("Failed to load goals");
            return;
          }
          const { goals } = await response.json();
          set({ goals, hydrated: true });
        } catch (error) {
          console.error("Failed to load goals:", error);
        }
      },
    }),
    {
      name: GOAL_STORAGE_KEY,
      storage: goalStorage,
      partialize: (state) => ({
        goals: state.goals,
        currentGoal: state.currentGoal,
        activeStepId: state.activeStepId,
      }),
    }
  )
);


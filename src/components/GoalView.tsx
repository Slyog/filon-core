"use client";

import { useEffect, useState } from "react";
import { useGoalState } from "@/hooks/useGoalState";
import type { Goal, Track, Step } from "@/types/filon";

interface GoalViewProps {
  goalId?: string;
}

export default function GoalView({ goalId }: GoalViewProps) {
  const { goals, currentGoal, loadGoals, setCurrentGoal } = useGoalState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals().finally(() => setLoading(false));
  }, [loadGoals]);

  useEffect(() => {
    if (goalId) {
      const goal = goals.find((g) => g.id === goalId);
      if (goal) {
        setCurrentGoal(goal);
      } else {
        // Fetch goal if not in store
        fetch(`/api/goals/${goalId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.goal) {
              setCurrentGoal(data.goal);
            }
          })
          .catch((err) => console.error("Failed to load goal:", err));
      }
    }
  }, [goalId, goals, setCurrentGoal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-cyan-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0F12] text-cyan-200 p-6">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {currentGoal && (
          <div className="space-y-6">
            <div className="border border-cyan-500/20 rounded-xl p-6 bg-surface-base/70">
              <h1 className="text-2xl font-bold text-cyan-100 mb-2">
                {currentGoal.title}
              </h1>
              {currentGoal.description && (
                <p className="text-cyan-300/80">{currentGoal.description}</p>
              )}
            </div>

            {currentGoal.tracks && currentGoal.tracks.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-cyan-200">Tracks</h2>
                {currentGoal.tracks.map((track) => (
                  <TrackCard key={track.id} track={track} />
                ))}
              </div>
            )}
          </div>
        )}

        {!currentGoal && (
          <div className="text-center py-12">
            <p className="text-cyan-400/70">
              Create a goal to get started with FILON v4
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TrackCard({ track }: { track: Track }) {
  return (
    <div className="border border-cyan-500/20 rounded-lg p-4 bg-surface-hover/50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-cyan-100">{track.type}</h3>
        <span className="text-sm text-cyan-400/70">Score: {track.score}</span>
      </div>
      {track.aiReasoning && (
        <p className="text-sm text-cyan-300/70 mb-3">{track.aiReasoning}</p>
      )}
      {track.steps && track.steps.length > 0 && (
        <div className="space-y-2 mt-3">
          <h4 className="text-sm font-medium text-cyan-200">Steps</h4>
          {track.steps.map((step) => (
            <StepCard key={step.id} step={step} />
          ))}
        </div>
      )}
    </div>
  );
}

function StepCard({ step }: { step: Step }) {
  return (
    <div className="border border-cyan-500/10 rounded p-3 bg-surface-base/50">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-medium text-cyan-100">{step.title}</h4>
        <span
          className={`text-xs px-2 py-1 rounded ${
            step.state === "done"
              ? "bg-emerald-500/20 text-emerald-300"
              : step.state === "active"
              ? "bg-cyan-500/20 text-cyan-300"
              : "bg-gray-500/20 text-gray-300"
          }`}
        >
          {step.state}
        </span>
      </div>
      {step.detail && (
        <p className="text-sm text-cyan-300/70 mb-2">{step.detail}</p>
      )}
      <div className="flex items-center gap-4 text-xs text-cyan-400/60">
        <span>Difficulty: {step.difficulty}/10</span>
        <span>Time: {step.timeEstimate}m</span>
      </div>
      {step.actions && step.actions.length > 0 && (
        <div className="mt-2 space-y-1">
          {step.actions.map((action) => (
            <div
              key={action.id}
              className="flex items-center gap-2 text-xs text-cyan-300/70"
            >
              <input
                type="checkbox"
                checked={action.done}
                readOnly
                className="rounded border-cyan-500/30"
              />
              <span>{action.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


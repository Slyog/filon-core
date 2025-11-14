"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type OnboardingPresetId = "career" | "health" | "deep_work" | "custom";

type Preset = {
  id: OnboardingPresetId;
  title: string;
  description: string;
};

const presets: Preset[] = [
  {
    id: "career",
    title: "Career & Learning",
    description: "Grow your skills, portfolio and job options.",
  },
  {
    id: "health",
    title: "Health & Fitness",
    description: "Structure training, habits and recovery.",
  },
  {
    id: "deep_work",
    title: "Deep Work Lab",
    description: "Focus on one big project with fewer distractions.",
  },
  {
    id: "custom",
    title: "Custom Workspace",
    description: "Start from scratch and define everything yourself.",
  },
];

export interface OnboardingPresetPanelProps {
  // eslint-disable-next-line no-unused-vars
  onSelectPreset?: (presetId: OnboardingPresetId) => void;
  className?: string;
}

export function OnboardingPresetPanel({
  onSelectPreset,
  className,
}: OnboardingPresetPanelProps) {
  const handlePresetClick = (presetId: OnboardingPresetId) => {
    onSelectPreset?.(presetId);
  };

  return (
    <div
      className={cn(
        "bg-filon-surface border border-filon-border/40 rounded-filon p-5 max-w-xl w-full",
        className
      )}
    >
      {/* Title */}
      <h2 className="text-base font-semibold text-filon-text">
        Where do you want to focus right now?
      </h2>

      {/* Subtitle */}
      <p className="text-sm text-filon-text/70 mt-1">
        Pick a starting space. You can change or refine this later.
      </p>

      {/* Preset Grid (2x2) */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {presets.map((preset) => (
          <Button
            key={preset.id}
            variant="ghost"
            onClick={() => handlePresetClick(preset.id)}
            className={cn(
              "h-auto flex flex-col items-start justify-start p-4 text-left",
              "bg-filon-surface/60 border border-filon-border/40 rounded-filon",
              "hover:bg-filon-surface/80 hover:border-filon-accent/60 hover:shadow-glow",
              "transition-all"
            )}
            aria-label={`Select ${preset.title} preset`}
          >
            <span className="text-sm font-medium text-filon-text">
              {preset.title}
            </span>
            <span className="text-xs text-filon-text/70 mt-1">
              {preset.description}
            </span>
          </Button>
        ))}
      </div>

      {/* Footer Hint */}
      <p className="text-[11px] text-filon-text/60 text-right mt-3">
        You&apos;ll still be able to adjust your goals and tracks.
      </p>
    </div>
  );
}


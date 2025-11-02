import { moods } from "@/styles/moods";

export type MoodKey = keyof typeof moods;
export interface MoodPreset {
  moodColor: string;
  glowIntensity: number;
  rippleSpeed: number;
  particleFlow: number;
}

export function getMoodPreset(state: MoodKey): MoodPreset {
  return moods[state] ?? moods.focus;
}


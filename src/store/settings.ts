import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  audioEnabled: boolean;
  animationSpeed: number;
  glowIntensity: number;
  theme: string;
  rememberSpatial: boolean;
  setAudio: (v: boolean) => void;
  setAnimationSpeed: (v: number) => void;
  setGlowIntensity: (v: number) => void;
  setTheme: (t: string) => void;
  setRememberSpatial: (v: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      audioEnabled: false,
      animationSpeed: 1,
      glowIntensity: 1,
      theme: "dark",
      rememberSpatial: true,
      setAudio: (v: boolean) => set({ audioEnabled: v }),
      setAnimationSpeed: (v: number) => set({ animationSpeed: v }),
      setGlowIntensity: (v: number) => set({ glowIntensity: v }),
      setTheme: (t: string) => set({ theme: t }),
      setRememberSpatial: (v: boolean) => set({ rememberSpatial: v }),
    }),
    {
      name: "filon-settings", // key im localStorage
      version: 1,
      partialize: (state) => ({
        audioEnabled: state.audioEnabled,
        animationSpeed: state.animationSpeed,
        glowIntensity: state.glowIntensity,
        theme: state.theme,
        rememberSpatial: state.rememberSpatial,
      }),
    }
  )
);


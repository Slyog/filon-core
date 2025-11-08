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

// Apply visual effects based on settings
const applyVisualSettings = (animationSpeed: number, glowIntensity: number) => {
  if (typeof document === "undefined") return;

  // Set data-motion attribute when animation speed is very low
  if (animationSpeed <= 0.05) {
    document.body.dataset.motion = "off";
  } else {
    document.body.dataset.motion = "";
  }

  // Set CSS variable for glow intensity
  if (glowIntensity <= 0.05) {
    document.documentElement.style.setProperty("--glow-intensity", "0");
  } else {
    document.documentElement.style.setProperty(
      "--glow-intensity",
      String(glowIntensity)
    );
  }

  // Set CSS variable for animation speed
  document.documentElement.style.setProperty(
    "--animation-speed",
    String(animationSpeed)
  );
};

export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      audioEnabled: false,
      animationSpeed: 1,
      glowIntensity: 1,
      theme: "dark",
      rememberSpatial: true,
      setAudio: (v: boolean) => set({ audioEnabled: v }),
      setAnimationSpeed: (v: number) => {
        set({ animationSpeed: v });
        applyVisualSettings(v, get().glowIntensity);
      },
      setGlowIntensity: (v: number) => {
        set({ glowIntensity: v });
        applyVisualSettings(get().animationSpeed, v);
      },
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
      onRehydrateStorage: () => (state) => {
        // Apply settings when store is rehydrated from localStorage
        if (state) {
          applyVisualSettings(state.animationSpeed, state.glowIntensity);
        }
      },
    }
  )
);

// Apply initial settings on mount
if (typeof window !== "undefined") {
  const store = useSettings.getState();
  applyVisualSettings(store.animationSpeed, store.glowIntensity);
}

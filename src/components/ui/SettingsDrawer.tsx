"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/store/settings";
import { useState } from "react";

export const SettingsDrawer = () => {
  const [open, setOpen] = useState(false);
  const {
    audioEnabled,
    animationSpeed,
    glowIntensity,
    theme,
    rememberSpatial,
    setAudio,
    setAnimationSpeed,
    setGlowIntensity,
    setTheme,
    setRememberSpatial,
  } = useSettings();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="absolute top-3 right-3 px-3 py-2 rounded-md bg-[hsl(var(--filon-bg)/0.8)] hover:bg-[hsl(var(--filon-bg)/0.6)] text-[hsl(var(--filon-accent))] text-sm border border-[hsl(var(--filon-accent)/0.2)] transition-colors">
          ⚙️ Settings
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <AnimatePresence>
          {open && (
            <>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[100] bg-[hsl(var(--filon-bg)/0.8)] backdrop-blur-md"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 80, damping: 22 }}
                  className="fixed top-0 right-0 h-full w-80 z-[200] bg-[hsl(var(--filon-bg)/0.98)] border-l border-[hsl(var(--filon-accent)/0.2)] text-[hsl(var(--filon-primary))] shadow-2xl p-6 flex flex-col gap-6"
                >
                <Dialog.Title className="text-lg font-medium text-[hsl(var(--filon-accent))] mb-2">
                  FILON Settings
                </Dialog.Title>

                <div className="flex flex-col gap-6 flex-1 overflow-y-auto">
                  {/* Audio */}
                  <label className="flex justify-between items-center cursor-pointer">
                    <span className="text-sm">Audio Feedback</span>
                    <input
                      type="checkbox"
                      checked={audioEnabled}
                      onChange={(e) => setAudio(e.target.checked)}
                      className="w-4 h-4 rounded border-[hsl(var(--filon-accent)/0.4)] bg-transparent accent-[hsl(var(--filon-accent))] cursor-pointer"
                    />
                  </label>

                  {/* Animation Speed */}
                  <label className="flex flex-col gap-2">
                    <span className="text-sm">
                      Animation Speed: {animationSpeed.toFixed(1)}x
                    </span>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={animationSpeed}
                      onChange={(e) =>
                        setAnimationSpeed(Number(e.target.value))
                      }
                      className="w-full h-2 bg-[hsl(var(--filon-bg))] rounded-lg appearance-none cursor-pointer accent-[hsl(var(--filon-accent))]"
                    />
                  </label>

                  {/* Glow Intensity */}
                  <label className="flex flex-col gap-2">
                    <span className="text-sm">
                      Glow Intensity: {glowIntensity.toFixed(1)}x
                    </span>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={glowIntensity}
                      onChange={(e) =>
                        setGlowIntensity(Number(e.target.value))
                      }
                      className="w-full h-2 bg-[hsl(var(--filon-bg))] rounded-lg appearance-none cursor-pointer accent-[hsl(var(--filon-accent))]"
                    />
                  </label>

                  {/* Theme */}
                  <label className="flex flex-col gap-2">
                    <span className="text-sm">Theme Mode</span>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      className="bg-[hsl(var(--filon-bg))] border border-[hsl(var(--filon-accent)/0.4)] rounded-md p-2 text-sm text-[hsl(var(--filon-primary))] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[hsl(var(--filon-accent)/0.5)]"
                    >
                      <option value="dark">Dark</option>
                      <option value="focus">Focus</option>
                      <option value="reflection">Reflection</option>
                    </select>
                  </label>

                  {/* Remember Graph Position */}
                  <label className="flex justify-between items-center cursor-pointer">
                    <span className="text-sm">Remember Graph Position</span>
                    <input
                      type="checkbox"
                      checked={rememberSpatial}
                      onChange={(e) => setRememberSpatial(e.target.checked)}
                      className="w-4 h-4 rounded border-[hsl(var(--filon-accent)/0.4)] bg-transparent accent-[hsl(var(--filon-accent))] cursor-pointer"
                    />
                  </label>
                </div>

                <Dialog.Close asChild>
                  <button className="mt-auto py-2 px-3 bg-[hsl(var(--filon-accent)/0.2)] hover:bg-[hsl(var(--filon-accent)/0.4)] rounded-md text-sm transition-colors">
                    Close
                  </button>
                </Dialog.Close>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
};


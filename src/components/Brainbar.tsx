"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Sparkles, Mic } from "lucide-react";
import { startVoiceCapture } from "@/lib/voiceInput";
import { useSessionStore } from "@/store/SessionStore";
import { useFeedbackStore } from "@/store/FeedbackStore";

interface BrainbarProps {
  onThoughtSubmit?: (text: string, thoughtType: string) => void;
}

export default function Brainbar({ onThoughtSubmit }: BrainbarProps) {
  const [inputValue, setInputValue] = useState("");
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [submitAnnouncement, setSubmitAnnouncement] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastKeyTime, setLastKeyTime] = useState<number>(0);
  const enqueueThought = useSessionStore((s) => s.enqueueThought);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const addFeedback = useFeedbackStore((s) => s.addFeedback);
  const reduced = useReducedMotion();
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(
    async (text: string, thoughtType?: string) => {
      if (!text.trim()) {
        addFeedback({
          type: "user_action",
          payload: { message: "Bitte zuerst Text eingeben.", error: true },
        });
        setSubmitAnnouncement("Bitte zuerst Text eingeben.");
        return;
      }

      // QA: Log keystroke to action delay
      if (lastKeyTime > 0) {
        const delay = performance.now() - lastKeyTime;
        if (
          typeof window !== "undefined" &&
          (
            window as unknown as {
              __filonPerf?: { logKeystrokeDelay: (delay: number) => void };
            }
          ).__filonPerf
        ) {
          (
            window as unknown as {
              __filonPerf: { logKeystrokeDelay: (delay: number) => void };
            }
          ).__filonPerf.logKeystrokeDelay(delay);
        }
      }

      setIsSaving(true);

      // Default to "Idea" if no type provided
      // TODO: Integrate ThoughtTypeSelector modal for type selection
      const type = thoughtType || "Idea";

      // TODO: Integrate with GraphCanvas thought creation logic
      // TODO: Add Quick Chip Commands (/add, /link, /goal) parsing
      if (onThoughtSubmit) {
        onThoughtSubmit(text, type);
      } else {
        // Fallback: add to pending thoughts
        if (activeSessionId) {
          enqueueThought({
            sessionId: activeSessionId,
            content: text,
            thoughtType: type,
          });
        }
      }

      setInputValue("");
      setSubmitAnnouncement(
        `Gedanke "${text.substring(0, 30)}${
          text.length > 30 ? "..." : ""
        }" wurde hinzugefügt.`
      );

      // Hide saving indicator after short delay
      setTimeout(() => {
        setIsSaving(false);
      }, 150);

      // Clear announcement after a delay
      setTimeout(() => {
        setSubmitAnnouncement("");
      }, 3000);
    },
    [onThoughtSubmit, enqueueThought, activeSessionId, addFeedback, lastKeyTime]
  );

  const handleVoiceInput = useCallback(async () => {
    try {
      setIsVoiceActive(true);
      const transcript = await startVoiceCapture();
      if (transcript) {
        setInputValue(transcript);
        await handleSubmit(transcript);
      }
    } catch (err) {
      console.error("Voice input error:", err);
      addFeedback({
        type: "user_action",
        payload: { message: "Spracherkennung fehlgeschlagen.", error: true },
      });
    } finally {
      setIsVoiceActive(false);
    }
  }, [handleSubmit, addFeedback]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Track keystroke time for QA
      setLastKeyTime(performance.now());

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(inputValue);
      }
    },
    [inputValue, handleSubmit]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      setLastKeyTime(performance.now());
    },
    []
  );

  return (
    <form
      role="search"
      aria-label="Brainbar"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(inputValue);
      }}
      className="w-full"
    >
      <motion.div
        className="w-full flex items-center gap-3 px-4 py-3 bg-surface-hover backdrop-blur-md border-b border-neutral-800 motion-soft"
        initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }
        }
      >
        <Sparkles className="text-brand shrink-0" size={20} />

        <label htmlFor="brainbar-input" className="sr-only">
          Gedanken eingeben
        </label>
        <input
          id="brainbar-input"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Denke hier... (Tippe oder sprich)"
          aria-label="Gedanken eingeben"
          className="flex-1 bg-transparent outline-none text-text-primary placeholder-text-muted text-sm rounded-xl focus:ring-2 focus:ring-brand focus-visible:ring-brand"
        />

        {/* Saving indicator with Framer Motion fade < 150ms */}
        <AnimatePresence>
          {isSaving && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
              className="text-xs text-cyan-400"
            >
              Saving…
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Input Button */}
        <button
          onClick={handleVoiceInput}
          disabled={isVoiceActive}
          className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${
            isVoiceActive
              ? "bg-brand text-white animate-pulse"
              : "bg-neutral-800 text-text-secondary hover:bg-neutral-700"
          }`}
          title="Spracheingabe"
        >
          <Mic size={16} />
        </button>

        {/* Quick Chips */}
        <div className="flex gap-2">
          <button
            type="button"
            role="button"
            onClick={() => {
              // TODO: Implement /add command logic
              addFeedback({
                type: "user_action",
                payload: { message: "/add Befehl wird implementiert..." },
              });
            }}
            aria-label="/add Befehl"
            title="/add Befehl"
            className="px-2 py-1 rounded-md bg-neutral-800 text-xs text-text-secondary hover:text-text-primary hover:glow transition-colors"
          >
            /add
          </button>
          <button
            type="button"
            role="button"
            onClick={() => {
              // TODO: Implement /link command logic
              addFeedback({
                type: "user_action",
                payload: { message: "/link Befehl wird implementiert..." },
              });
            }}
            aria-label="/link Befehl"
            title="/link Befehl"
            className="px-2 py-1 rounded-md bg-neutral-800 text-xs text-text-secondary hover:text-text-primary hover:glow transition-colors"
          >
            /link
          </button>
        </div>

        {/* Thought Type Selector (conditional) */}
        {/* TODO: Show ThoughtTypeSelector when input has content or on focus */}
      </motion.div>

      {/* Live region for announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {submitAnnouncement}
      </div>
    </form>
  );
}

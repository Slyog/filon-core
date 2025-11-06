"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, Mic } from "lucide-react";
import { useThoughtType } from "@/hooks/useThoughtType";
import ThoughtTypeSelector from "@/components/ThoughtTypeSelector";
import { startVoiceCapture } from "@/lib/voiceInput";
import { useSessionStore } from "@/store/SessionStore";
import { useFeedbackStore } from "@/store/FeedbackStore";

interface BrainbarProps {
  onThoughtSubmit?: (text: string, thoughtType: string) => void;
}

export default function Brainbar({ onThoughtSubmit }: BrainbarProps) {
  const [inputValue, setInputValue] = useState("");
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const { getType } = useThoughtType();
  const enqueueThought = useSessionStore((s) => s.enqueueThought);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const addFeedback = useFeedbackStore((s) => s.addFeedback);

  const handleSubmit = useCallback(
    async (text: string, thoughtType?: string) => {
      if (!text.trim()) {
        addFeedback({
          type: "user_action",
          payload: { message: "Bitte zuerst Text eingeben.", error: true },
        });
        return;
      }

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
    },
    [onThoughtSubmit, enqueueThought, activeSessionId, addFeedback]
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
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(inputValue);
      }
    },
    [inputValue, handleSubmit]
  );

  return (
    <motion.div
      className="w-full flex items-center gap-3 px-4 py-3 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Sparkles className="text-cyan-400 flex-shrink-0" size={20} />

      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Denke hier... (Tippe oder sprich)"
        className="flex-1 bg-transparent outline-none text-neutral-100 placeholder-neutral-500 text-sm"
      />

      {/* Voice Input Button */}
      <button
        onClick={handleVoiceInput}
        disabled={isVoiceActive}
        className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
          isVoiceActive
            ? "bg-cyan-500 text-white animate-pulse"
            : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
        }`}
        title="Spracheingabe"
      >
        <Mic size={16} />
      </button>

      {/* Quick Chips */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            // TODO: Implement /add command logic
            addFeedback({
              type: "user_action",
              payload: { message: "/add Befehl wird implementiert..." },
            });
          }}
          className="px-2 py-1 rounded-md bg-neutral-800 text-xs text-neutral-300 hover:bg-neutral-700 transition-colors"
        >
          /add
        </button>
        <button
          onClick={() => {
            // TODO: Implement /link command logic
            addFeedback({
              type: "user_action",
              payload: { message: "/link Befehl wird implementiert..." },
            });
          }}
          className="px-2 py-1 rounded-md bg-neutral-800 text-xs text-neutral-300 hover:bg-neutral-700 transition-colors"
        >
          /link
        </button>
      </div>

      {/* Thought Type Selector (conditional) */}
      {/* TODO: Show ThoughtTypeSelector when input has content or on focus */}
    </motion.div>
  );
}

"use client";

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { t } from "@/config/strings";
import { useGoalState } from "@/hooks/useGoalState";
import { useShallow } from "zustand/react/shallow";
import { useAICoPilot } from "@/hooks/useAICoPilot";
import { useAIFeedback } from "@/hooks/useAIFeedback";
import type { BrainCommand, BrainCommandType } from "@/types/brain";
import { log } from "@/utils/logger";
import { ContextStreamPanel } from "@/components/ContextStream";

export type BrainbarCommandType = BrainCommandType;
export type BrainbarCommand = BrainCommand;

export interface BrainbarHandle {
  focus: () => void;
  prefill: (value: string) => void;
  clear: () => void;
}

interface BrainbarProps {
  onSubmit?: (command: BrainbarCommand) => void | Promise<void>;
  autoFocus?: boolean;
}

const COMMAND_MAP: Record<string, BrainCommandType> = {
  "/goal": "goal",
};

const clampText = (text: string) => {
  if (text.length <= 32) return text;
  return `${text.slice(0, 29)}…`;
};

const Brainbar = React.forwardRef<BrainbarHandle, BrainbarProps>(
  ({ onSubmit, autoFocus = false }, ref) => {
    const [value, setValue] = useState("");
    const [focused, setFocused] = useState(false);
    const [pulse, setPulse] = useState(false);
    const [announcement, setAnnouncement] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { createGoal, lastError, clearError } = useGoalState(
      useShallow((state) => ({
        createGoal: state.createGoal,
        lastError: state.lastError,
        clearError: state.clearError,
      }))
    );
    const {
      input: aiInput,
      handleInputChange: handleAiInputChange,
      handleSubmit: handleAiSubmit,
      messages: aiMessages,
      isLoading: aiLoading,
    } = useAICoPilot();

    useAIFeedback(aiMessages);

    const hasCommand = value.trimStart().startsWith("/");

    const parsed = useMemo(() => {
      const trimmed = value.trim();
      const [potentialCommand, ...rest] = trimmed.split(" ");
      const normalized =
        COMMAND_MAP[potentialCommand?.toLowerCase() ?? ""] ?? "goal";
      const text =
        COMMAND_MAP[potentialCommand?.toLowerCase() ?? ""] !== undefined
          ? rest.join(" ").trim()
          : trimmed;
      return {
        type: normalized,
        text,
      };
    }, [value]);

    const latestAssistantMessage = useMemo(() => {
      const assistant = [...aiMessages]
        .reverse()
        .find((msg) => msg.role === "assistant");
      return assistant?.content?.trim() ?? "";
    }, [aiMessages]);

    const triggerPulse = useCallback(() => {
      setPulse(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setPulse(false);
      }, 600);
    }, []);

    const handleSubmit = useCallback(
      async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (submitting || !value.trim()) return;

        setSubmitting(true);
        clearError();

        try {
          const command: BrainbarCommand = {
            type: parsed.type,
            text: parsed.text,
          };

          if (parsed.type === "goal") {
            const result = await createGoal(parsed.text);
            if (result.ok) {
              setAnnouncement("✨ Goal created successfully!");
              setValue("");
              triggerPulse();
              // Auto-load tracks and steps after goal creation
              // This will be handled by the API/UI layer
            } else {
              setAnnouncement(result.error.message);
            }
          }

          await onSubmit?.(command);
        } catch (error: any) {
          log.error("[Brainbar] Submit error:", error);
          setAnnouncement("❌ Failed to process command");
        } finally {
          setSubmitting(false);
        }
      },
      [value, parsed, submitting, createGoal, clearError, onSubmit, triggerPulse]
    );

    useEffect(() => {
      if (lastError) {
        setAnnouncement(lastError.message);
      }
    }, [lastError]);

    useEffect(() => {
      if (announcement) {
        const timer = setTimeout(() => {
          setAnnouncement("");
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [announcement]);

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
      prefill: (val: string) => {
        setValue(val);
        inputRef.current?.focus();
      },
      clear: () => {
        setValue("");
        clearError();
      },
    }));

    useEffect(() => {
      if (autoFocus && inputRef.current) {
        inputRef.current.focus();
      }
    }, [autoFocus]);

    return (
      <div className="w-full space-y-4">
        <form onSubmit={handleSubmit} className="relative w-full">
          <div
            className={`relative flex items-center rounded-2xl border bg-surface-base/70 px-4 py-3 backdrop-blur-xl transition-all ${
              focused
                ? "border-cyan-400/50 shadow-lg shadow-cyan-500/20"
                : "border-cyan-500/20 hover:border-cyan-500/30"
            } ${pulse ? "animate-pulse" : ""}`}
          >
            <Sparkles
              className={`mr-3 h-5 w-5 transition-colors ${
                focused ? "text-cyan-400" : "text-cyan-500/60"
              }`}
            />
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Enter your goal… (/goal for command)"
              className="flex-1 bg-transparent text-base text-cyan-100 placeholder:text-cyan-200/70 focus:outline-none"
              disabled={submitting}
            />
            {value.trim() && (
              <button
                type="submit"
                disabled={submitting}
                className="ml-2 rounded-lg bg-cyan-600/40 px-3 py-1.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Creating…" : "Create Goal"}
              </button>
            )}
          </div>

          <AnimatePresence>
            {announcement && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 text-sm text-cyan-300"
              >
                {announcement}
              </motion.p>
            )}
          </AnimatePresence>
        </form>

        {latestAssistantMessage && (
          <p className="rounded-xl border border-cyan-500/20 bg-surface-hover/70 px-4 py-3 text-sm text-cyan-200">
            {latestAssistantMessage}
          </p>
        )}

        <ContextStreamPanel />
      </div>
    );
  }
);

Brainbar.displayName = "Brainbar";

export default Brainbar;

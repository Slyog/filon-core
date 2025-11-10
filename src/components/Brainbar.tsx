"use client";

import React, {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { t } from "@/config/strings";
import { useBrainState } from "@/hooks/useBrainState";
import { useShallow } from "zustand/react/shallow";
import { useAICoPilot } from "@/hooks/useAICoPilot";
import type { BrainCommand, BrainCommandType } from "@/types/brain";

export type BrainbarCommandType = BrainCommandType;
export interface BrainbarCommand extends BrainCommand {}

export interface BrainbarHandle {
  focus: () => void;
  prefill: (value: string) => void;
  clear: () => void;
}

interface BrainbarProps {
  onSubmit?: (command: BrainbarCommand) => void | Promise<void>;
  autoFocus?: boolean;
}

const COMMAND_MAP: Record<string, BrainbarCommandType> = {
  "/add": "add",
  "/link": "link",
  "/goal": "goal",
  "/due": "due",
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
    const { addNode, lastError, clearError } = useBrainState(
      useShallow((state) => ({
        addNode: state.addNode,
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

    const hasCommand = value.trimStart().startsWith("/");

    const parsed = useMemo(() => {
      const trimmed = value.trim();
      const [potentialCommand, ...rest] = trimmed.split(" ");
      const normalized =
        COMMAND_MAP[potentialCommand?.toLowerCase() ?? ""] ?? "add";
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
      timeoutRef.current = setTimeout(() => setPulse(false), 280);
    }, []);

    const announce = useCallback((message: string) => {
      setAnnouncement(message);
      setTimeout(() => setAnnouncement(""), 1800);
    }, []);

    const resolvedErrorMessage = useMemo(() => {
      if (!lastError) {
        return null;
      }

      if (lastError.code === "empty_input") {
        return t.enterThoughtFirst;
      }

      if (lastError.code === "duplicate") {
        return t.thoughtAlreadyExists.replace(
          "{text}",
          clampText(lastError.value ?? "")
        );
      }

      return lastError.message;
    }, [lastError]);

    const handleSubmit = useCallback(async () => {
      if (submitting) {
        return;
      }

      if (!parsed.text.trim()) {
        announce(t.enterThoughtFirst);
        return;
      }

      if (onSubmit) {
        await Promise.resolve(onSubmit(parsed));
        triggerPulse();
        announce(t.thoughtAdded.replace("{text}", clampText(parsed.text)));
        setValue("");
        return;
      }

      try {
        setSubmitting(true);
        const result = await addNode(parsed.text, parsed.type);
        if (!result.ok) {
          const message =
            result.error.code === "duplicate"
              ? t.thoughtAlreadyExists.replace(
                  "{text}",
                  clampText(result.error.value ?? "")
                )
              : result.error.code === "empty_input"
              ? t.enterThoughtFirst
              : result.error.message;
          announce(message);
          return;
        }
        triggerPulse();
        announce(t.thoughtAdded.replace("{text}", clampText(parsed.text)));
        setValue("");
      } finally {
        setSubmitting(false);
      }
    }, [addNode, announce, onSubmit, parsed, submitting, triggerPulse]);

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
      event
    ) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSubmit();
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setValue("");
        announce(t.inputCleared);
      }
    };

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    React.useEffect(() => {
      if (resolvedErrorMessage) {
        announce(resolvedErrorMessage);
      }
    }, [announce, resolvedErrorMessage]);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => inputRef.current?.focus(),
        prefill: (next) => {
          const command = next.startsWith("/") ? next : `/${next}`;
          setValue(`${command} `);
          const focusInput = () => {
            inputRef.current?.focus();
            const len = inputRef.current?.value.length ?? 0;
            inputRef.current?.setSelectionRange(len, len);
          };
          if (typeof window !== "undefined" && window.requestAnimationFrame) {
            window.requestAnimationFrame(focusInput);
          } else {
            focusInput();
          }
        },
        clear: () => setValue(""),
      }),
      []
    );

    return (
      <>
        <form
          role="search"
          aria-label="Brainbar"
          className="w-full space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <motion.div
            data-tour-id="tour-brainbar"
            layout
            data-focused={focused || pulse}
            className="focus-glow relative flex w-full items-center gap-3 rounded-2xl border border-cyan-400/10 bg-surface-hover/70 px-4 py-3 backdrop-blur-xl focus-within:ring-2 focus-within:ring-brand/60 focus-within:ring-offset-2 focus-within:ring-offset-surface-base"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.14, ease: [0.25, 0.8, 0.4, 1] }}
          >
            <Sparkles aria-hidden="true" className="text-brand" size={18} />
            <div className="flex flex-1 flex-col">
              <label htmlFor="brainbar-input" className="sr-only">
                {t.enterThought}
              </label>
              <input
                ref={inputRef}
                id="brainbar-input"
                type="text"
                value={value}
                autoFocus={autoFocus}
                spellCheck={false}
                onChange={(event) => {
                  if (lastError) {
                    clearError();
                  }
                  setValue(event.target.value);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (lastError) {
                    clearError();
                  }
                  setFocused(true);
                }}
                onBlur={() => setFocused(false)}
                placeholder={t.writeThought}
                aria-label={t.enterThought}
                aria-describedby="brainbar-description"
                aria-invalid={lastError ? "true" : undefined}
                className="w-full bg-transparent text-base text-text-primary placeholder:text-text-secondary/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base rounded-md"
              />
              <div
                id="brainbar-description"
                className="mt-1 text-xs text-text-secondary/70"
              >
                {hasCommand ? t.slashCommandActive : t.enterToConfirm}
              </div>
            </div>
            <AnimatePresence>
              {value.trim() && (
                <motion.span
                  key="badge"
                  initial={{ opacity: 0, scale: 0.86 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.86 }}
                  transition={{ duration: 0.12, ease: [0.25, 0.8, 0.4, 1] }}
                  className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand"
                >
                  /{parsed.type}
                </motion.span>
              )}
            </AnimatePresence>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.96 }}
              disabled={submitting}
              className="ml-2 inline-flex items-center justify-center rounded-xl bg-brand/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-brand transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={t.enterThought}
            >
              {submitting ? "…" : t.addThought}
            </motion.button>
          </motion.div>

          <AnimatePresence>
            {(resolvedErrorMessage || value.trim().length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: [0.25, 0.8, 0.4, 1] }}
                className="text-xs text-rose-300/90"
              >
                {resolvedErrorMessage ?? "\u00A0"}
              </motion.div>
            )}
          </AnimatePresence>

          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {announcement}
          </div>
        </form>

        <form
          onSubmit={handleAiSubmit}
          className="mt-4 flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-surface-hover/70 px-4 py-3 backdrop-blur-xl"
          aria-label="FILON AI Chat"
        >
          <label htmlFor="brainbar-ai-input" className="sr-only">
            Ask FILON AI
          </label>
          <input
            id="brainbar-ai-input"
            value={aiInput}
            onChange={handleAiInputChange}
            placeholder="Ask FILON AI..."
            className="flex-1 bg-transparent text-sm text-cyan-100 placeholder:text-cyan-200/70 focus:outline-none"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={aiLoading}
            className="rounded-xl bg-cyan-500/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-surface-base transition hover:bg-cyan-400/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:cursor-not-allowed disabled:opacity-60"
          >
            {aiLoading ? "…" : "Send"}
          </button>
        </form>

        {latestAssistantMessage && (
          <p
            className="mt-2 text-xs text-cyan-100/80"
            aria-live="polite"
            aria-atomic="true"
          >
            {latestAssistantMessage}
          </p>
        )}
      </>
    );
  }
);

Brainbar.displayName = "Brainbar";

export default Brainbar;

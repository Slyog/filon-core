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

export type BrainbarCommandType = "add" | "link" | "goal" | "due";

export interface BrainbarCommand {
  type: BrainbarCommandType;
  text: string;
}

export interface BrainbarHandle {
  focus: () => void;
  prefill: (value: string) => void;
  clear: () => void;
}

interface BrainbarProps {
  onSubmit: (command: BrainbarCommand) => void;
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
    const inputRef = useRef<HTMLInputElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const hasCommand = value.trimStart().startsWith("/");

    const parsed = useMemo(() => {
      const trimmed = value.trim();
      const [potentialCommand, ...rest] = trimmed.split(" ");
      const normalized = COMMAND_MAP[potentialCommand?.toLowerCase() ?? ""] ?? "add";
      const text =
        COMMAND_MAP[potentialCommand?.toLowerCase() ?? ""] !== undefined
          ? rest.join(" ").trim()
          : trimmed;
      return {
        type: normalized,
        text,
      };
    }, [value]);

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

    const handleSubmit = useCallback(() => {
      if (!parsed.text.trim()) {
        announce(t.enterThoughtFirst);
        return;
      }
      onSubmit(parsed);
      triggerPulse();
      announce(t.thoughtAdded.replace("{text}", clampText(parsed.text)));
      setValue("");
    }, [announce, onSubmit, parsed, triggerPulse]);

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
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={t.writeThought}
              aria-label={t.enterThought}
              aria-describedby="brainbar-description"
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
        </motion.div>

        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {announcement}
        </div>
      </form>
    );
  }
);

Brainbar.displayName = "Brainbar";

export default Brainbar;

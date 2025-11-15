"use client";

import { useCallback, useState, useRef, forwardRef, useImperativeHandle } from "react";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/ui/chip";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type ChipMode = "goal" | "link" | "summarize" | null;

export interface BrainbarHandle {
  focus: () => void;
  // eslint-disable-next-line no-unused-vars
  setValue: (value: string) => void;
}

export interface BrainbarProps {
  // eslint-disable-next-line no-unused-vars
  onSubmit?: (text: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const commandChips: Array<{ command: ChipMode; label: string }> = [
  { command: "goal", label: "/goal" },
  { command: "link", label: "/link" },
  { command: "summarize", label: "/summarize" },
];

export const Brainbar = forwardRef<BrainbarHandle, BrainbarProps>(function Brainbar(
  { onSubmit, isLoading = false, disabled = false },
  ref
) {
  const [inputValue, setInputValue] = useState("");
  const [activeMode, setActiveMode] = useState<ChipMode>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isCommittedPulse, setIsCommittedPulse] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const isDisabled = disabled || isLoading;

  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current?.focus();
    },
    setValue(nextValue: string) {
      setInputValue(nextValue);
      // Set cursor to end after React updates the DOM
      setTimeout(() => {
        if (inputRef.current) {
          const length = nextValue.length;
          inputRef.current.selectionStart = length;
          inputRef.current.selectionEnd = length;
          inputRef.current.focus();
        }
      }, 0);
    },
  }));

  const handleCommit = useCallback(() => {
    if (isDisabled) return;
    const trimmedValue = inputValue.trim();
    if (trimmedValue && onSubmit) {
      onSubmit(trimmedValue);
      setInputValue("");
      setActiveMode(null);
      setIsCommittedPulse(true);
      window.setTimeout(() => {
        setIsCommittedPulse(false);
      }, 180);
    }
  }, [inputValue, onSubmit, isDisabled]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      handleCommit();
    },
    [handleCommit]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (isDisabled) return;
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleCommit();
      }
      // Shift+Enter allows newline (default behavior)
    },
    [handleCommit, isDisabled]
  );

  const handleChipClick = useCallback(
    (command: ChipMode) => {
      if (command === null || isDisabled) return;

      // Toggle mode if clicking the same chip, otherwise set new mode
      const newMode = activeMode === command ? null : command;
      setActiveMode(newMode);

      // Insert command prefix at cursor position or append if no selection
      const input = inputRef.current;
      if (input) {
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;
        const currentValue = inputValue;

        if (newMode) {
          // Insert command prefix with space
          const prefix = `/${command} `;
          const newValue =
            currentValue.slice(0, start) + prefix + currentValue.slice(end);
          setInputValue(newValue);

          // Set cursor position after the inserted prefix
          setTimeout(() => {
            const newCursorPos = start + prefix.length;
            input.setSelectionRange(newCursorPos, newCursorPos);
            input.focus();
          }, 0);
        } else {
          // Remove the command prefix if toggling off
          const prefix = `/${command} `;
          if (currentValue.startsWith(prefix)) {
            setInputValue(currentValue.slice(prefix.length));
          }
        }
      }
    },
    [activeMode, inputValue, isDisabled]
  );

  return (
    <header 
      className="sticky top-0 z-40 border-b border-filon-border/60 bg-filon-surface shadow-sm"
      role="banner"
    >
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Brainbar"
        className="flex items-center gap-3 px-4 py-2"
      >
        {/* Left zone: reserved for secondary controls */}
        <div className="flex items-center gap-2 min-w-[80px]">
          {/* Left slot: optional chips/filter/label (can be minimal for now) */}
        </div>

        {/* Center zone: main input (dominant) */}
        <div className="flex-1">
          <div
            className={cn(
              "relative w-full rounded-filon border bg-filon-bg",
              "transition-colors transition-shadow transition-transform duration-150 ease-out",
              isFocused && "border-filon-accent/80 shadow-[0_0_15px_rgba(47,243,255,0.18)]",
              isCommittedPulse && "scale-[1.01] shadow-glow",
              !isFocused && !isCommittedPulse && "border-filon-border/60 shadow-none"
            )}
          >
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isDisabled}
              placeholder="Type a thought, goal or command…"
              aria-label="Brainbar input for thoughts, goals, and commands"
              aria-describedby="brainbar-helper"
              aria-disabled={isDisabled}
              className="w-full bg-transparent text-filon-text placeholder:text-filon-text/60 py-3 px-4 pr-12 rounded-filon border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-filon-accent focus-visible:ring-offset-1 focus-visible:ring-offset-filon-bg text-base disabled:cursor-not-allowed disabled:opacity-60"
            />
            <Sparkles
              className="absolute right-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-filon-text/60 pointer-events-none"
              aria-hidden="true"
            />
            {isLoading && (
              <span 
                className="absolute right-10 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-filon-accent animate-pulse" 
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        {/* Right zone: quick actions */}
        <div className="flex items-center gap-2 min-w-[80px] justify-end">
          {/* Quick actions / buttons - placeholder for now, visually balanced */}
        </div>
      </form>

      {/* Command chips below the main bar */}
      <div className="flex flex-wrap gap-2 px-4 pb-2">
        {commandChips.map(({ command, label }) => {
          const isActive = activeMode === command;
          return (
            <Chip
              key={command}
              variant={isActive ? "active" : "default"}
              onClick={() => handleChipClick(command)}
              disabled={isDisabled}
              aria-label={`Insert ${label} command`}
              aria-pressed={isActive}
              aria-disabled={isDisabled}
            >
              {label}
            </Chip>
          );
        })}
      </div>

      {/* Helper text */}
      <p
        id="brainbar-helper"
        className="px-4 pb-2 text-[10px] font-medium tracking-[0.16em] uppercase text-filon-text/50 text-right"
      >
        Press Enter to commit
      </p>
    </header>
  );
});

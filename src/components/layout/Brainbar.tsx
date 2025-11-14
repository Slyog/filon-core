"use client";

import { useCallback, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Search, Sparkles } from "lucide-react";

type ChipMode = "goal" | "link" | "summarize" | null;

type BrainbarProps = {
  // eslint-disable-next-line no-unused-vars
  onSubmit?: (text: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
};

const commandChips: Array<{ command: ChipMode; label: string }> = [
  { command: "goal", label: "/goal" },
  { command: "link", label: "/link" },
  { command: "summarize", label: "/summarize" },
];

export function Brainbar({ onSubmit, isLoading = false, disabled = false }: BrainbarProps) {
  const [inputValue, setInputValue] = useState("");
  const [activeMode, setActiveMode] = useState<ChipMode>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const isDisabled = disabled || isLoading;

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isDisabled) return;
      const trimmedValue = inputValue.trim();
      if (trimmedValue && onSubmit) {
        onSubmit(trimmedValue);
        setInputValue("");
        setActiveMode(null);
      }
    },
    [inputValue, onSubmit, isDisabled]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (isDisabled) return;
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const trimmedValue = inputValue.trim();
        if (trimmedValue && onSubmit) {
          onSubmit(trimmedValue);
          setInputValue("");
          setActiveMode(null);
        }
      }
      // Shift+Enter allows newline (default behavior)
    },
    [inputValue, onSubmit, isDisabled]
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
    <header className="sticky top-0 z-40 border-b border-filon-border/70 bg-filon-bg/95 px-6 py-4 backdrop-blur-sm supports-[backdrop-filter]:bg-filon-bg/80">
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Brainbar"
        className="flex flex-col gap-3.5"
      >
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-filon-text/55">
          <span>Brainbar</span>
          <span className="text-filon-text/55">Shift + Enter</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search 
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-filon-text/55" 
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isDisabled}
              placeholder="Enter a thought, goal, or link…"
              aria-label="Brainbar input for thoughts, goals, and links"
              aria-disabled={isDisabled}
              className="h-11 rounded-xl border border-filon-border/80 bg-filon-surface/90 pl-11 pr-16 text-base text-filon-text placeholder:text-filon-text/55 focus-visible:border-filon-accent/80 focus-visible:ring-2 focus-visible:ring-filon-accent/50 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-filon-border/80"
            />
            <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-filon-border/70 bg-filon-surface/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-filon-text/70">
              Enter
            </kbd>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isDisabled}
            aria-label="Commit thought"
            aria-disabled={isDisabled}
            className="h-11 min-w-[140px]"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>Commit Thought</span>
            {isLoading && (
              <span 
                className="ml-1 h-1.5 w-1.5 rounded-full bg-filon-bg animate-pulse" 
                aria-hidden="true"
              />
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {commandChips.map(({ command, label }) => {
            const isActive = activeMode === command;
            return (
              <Chip
                key={command}
                variant={isActive ? "active" : "default"}
                onClick={() => handleChipClick(command)}
                disabled={isDisabled}
                aria-label={`Insert ${label} command`}
                aria-disabled={isDisabled}
              >
                {label}
              </Chip>
            );
          })}
        </div>
      </form>
    </header>
  );
}

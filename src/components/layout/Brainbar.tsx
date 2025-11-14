"use client";

import { useCallback, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";

type ChipMode = "goal" | "link" | "summarize" | null;

type BrainbarProps = {
  // eslint-disable-next-line no-unused-vars
  onSubmit?: (text: string) => void;
};

const commandChips: Array<{ command: ChipMode; label: string }> = [
  { command: "goal", label: "/goal" },
  { command: "link", label: "/link" },
  { command: "summarize", label: "/summarize" },
];

export function Brainbar({ onSubmit }: BrainbarProps) {
  const [inputValue, setInputValue] = useState("");
  const [activeMode, setActiveMode] = useState<ChipMode>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmedValue = inputValue.trim();
      if (trimmedValue && onSubmit) {
        onSubmit(trimmedValue);
        setInputValue("");
        setActiveMode(null);
      }
    },
    [inputValue, onSubmit]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
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
    [inputValue, onSubmit]
  );

  const handleChipClick = useCallback(
    (command: ChipMode) => {
      if (command === null) return;

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
    [activeMode, inputValue]
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
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-filon-text/55" />
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a thought, goal, or link…"
              aria-label="Brainbar input"
              className="h-11 rounded-xl border border-filon-border/80 bg-filon-surface/90 pl-11 pr-16 text-base text-filon-text placeholder:text-filon-text/55 focus-visible:border-filon-accent/80 focus-visible:ring-2 focus-visible:ring-filon-accent/50 focus-visible:ring-offset-0"
            />
            <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-filon-border/70 bg-filon-surface/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-filon-text/70">
              Enter
            </kbd>
          </div>

          <button
            type="submit"
            className="flex h-11 min-w-[140px] items-center justify-center gap-2 rounded-xl border border-filon-accent/50 bg-filon-surface/90 px-4 text-sm font-semibold text-filon-text transition-colors hover:border-filon-accent/70 hover:bg-filon-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-filon-accent/60 focus-visible:ring-offset-0"
          >
            <Sparkles className="h-4 w-4 text-filon-accent" />
            Commit Thought
          </button>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {commandChips.map(({ command, label }) => {
            const isActive = activeMode === command;
            return (
              <button
                key={command}
                type="button"
                onClick={() => handleChipClick(command)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-filon-accent/60 focus-visible:ring-offset-0 ${
                  isActive
                    ? "border-filon-accent/70 bg-filon-surface/90 text-filon-accent"
                    : "border-filon-border/70 bg-filon-surface/60 text-filon-text/75 hover:border-filon-accent/50 hover:bg-filon-surface/80 hover:text-filon-text"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </form>
    </header>
  );
}

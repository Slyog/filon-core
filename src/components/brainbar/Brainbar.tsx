"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export interface BrainbarHandle {
  focus: () => void;
  setValue: (value: string) => void;
}

type BrainbarProps = {
  onSubmit?: (text: string) => void;
  className?: string;
  isLoading?: boolean;
  disabled?: boolean;
};

export const Brainbar = forwardRef<BrainbarHandle, BrainbarProps>(function Brainbar(
  { onSubmit, className, isLoading = false, disabled = false },
  ref
) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isBusy = disabled || isLoading;

  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current?.focus();
    },
    setValue(nextValue: string) {
      setValue(nextValue);
      requestAnimationFrame(() => {
        const input = inputRef.current;
        if (input) {
          const caret = nextValue.length;
          input.selectionStart = caret;
          input.selectionEnd = caret;
          input.focus();
        }
      });
    },
  }));

  const handleCommit = useCallback(() => {
    if (isBusy) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit?.(trimmed);
    setValue("");
  }, [isBusy, onSubmit, value]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleCommit();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setValue("");
      }
    },
    [handleCommit]
  );

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative w-full rounded-2xl border border-white/10 bg-surface-hover/80 backdrop-blur-sm",
          "transition-all duration-150 ease-out shadow-[0_10px_30px_rgba(0,0,0,0.45)]",
          isFocused ? "ring-2 ring-brand/50 ring-offset-1 ring-offset-[#050509]" : "ring-0"
        )}
      >
        <input
          id="brainbar-input"
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Type a thought, goal or command…"
          aria-label="Enter thought"
          className={cn(
            "w-full bg-transparent text-white placeholder:text-white/60",
            "py-3 px-4 rounded-md outline-none",
            "focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050509]",
            "disabled:cursor-not-allowed disabled:opacity-60"
          )}
          disabled={isBusy}
        />
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-brand"
          aria-hidden="true"
        />
      </div>
    </div>
  );
});

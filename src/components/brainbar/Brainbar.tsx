"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type BrainbarProps = {
	// eslint-disable-next-line no-unused-vars
	onSubmit?: (text: string) => void;
	className?: string;
};

export function Brainbar({ onSubmit, className }: BrainbarProps) {
	const [value, setValue] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleCommit = useCallback(() => {
		const trimmed = value.trim();
		if (!trimmed) return;
		onSubmit?.(trimmed);
		setValue("");
	}, [onSubmit, value]);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>) => {
			// Block multi-line; Shift+Enter should not insert newline in input type="text"
			if (event.key === "Enter") {
				event.preventDefault();
				handleCommit();
				return;
			}
			if (event.key === "Escape") {
				event.preventDefault();
				setValue("");
				return;
			}
		},
		[handleCommit]
	);

	return (
		<div className={cn("w-full", className)}>
			<div
				className={cn(
					"relative w-full rounded-filon border border-white/10 bg-[#0A0A0C]/80 backdrop-blur-sm",
					"transition-all duration-150 ease-out",
					"shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] min-h-[52px]",
					isFocused
						? "ring-2 ring-filon-accent/70 ring-offset-1 ring-offset-[#050509]"
						: "ring-0"
				)}
			>
				<input
					ref={inputRef}
					type="text"
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={handleKeyDown}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					placeholder="Type a thought, goal or command…"
					aria-label="FILON Command Box"
					className={cn(
						"w-full bg-transparent text-white placeholder:text-white/60",
						"py-3 px-4 rounded-filon outline-none",
						"focus:outline-none"
					)}
				/>
				{/* Soft cyan filament dot on the right */}
				<span
					className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-filon-accent"
					aria-hidden="true"
				/>
			</div>
		</div>
	);
}



"use client";

import { AnimatePresence, motion } from "framer-motion";

type AutosaveIndicatorProps = {
	isSaving: boolean;
};

export function AutosaveIndicator({ isSaving }: AutosaveIndicatorProps) {
	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={isSaving ? "saving" : "saved"}
				initial={{ opacity: 0, y: -4 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -4 }}
				transition={{ duration: 0.18, ease: "easeOut" }}
				className="pointer-events-none absolute top-4 right-4 z-10 select-none"
				aria-live="polite"
				role="status"
			>
				<span className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-white">
					<span
						className={`inline-block h-1.5 w-1.5 rounded-full ${isSaving ? "bg-filon-accent animate-pulse" : "bg-filon-text/40"}`}
						aria-hidden="true"
					/>
					{isSaving ? "Saving…" : "Saved"}
				</span>
			</motion.div>
		</AnimatePresence>
	);
}



"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

type RestoreToastProps = {
  isVisible: boolean;
  onRestore: () => void;
  onDiscard: () => void;
};

export function RestoreToast({ isVisible, onRestore, onDiscard }: RestoreToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
          className="fixed bottom-6 right-8 z-50 pointer-events-auto"
          role="alert"
          aria-live="polite"
          data-testid="restore-toast"
        >
          <div className="flex min-w-[320px] max-w-[400px] flex-col gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/15 px-4 py-3 text-amber-100 shadow-[0_0_28px_rgba(245,158,11,0.35)] backdrop-blur-lg">
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-lg shrink-0">
                💾
              </span>
              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-semibold text-amber-50">
                  Unsaved session detected
                </h3>
                <p className="text-xs leading-relaxed text-amber-200/90">
                  A previously saved canvas was found. Restore it?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-8">
              <Button
                variant="primary"
                size="sm"
                onClick={onRestore}
                className="flex-1 bg-amber-600/80 hover:bg-amber-600 text-amber-50 border border-amber-400/30"
              >
                Restore
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDiscard}
                className="flex-1 text-amber-200/90 hover:text-amber-50 hover:bg-amber-500/20"
              >
                Discard
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


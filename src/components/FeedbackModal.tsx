"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, X } from "lucide-react";
import { useFeedbackStore, type FeedbackType } from "@/store/FeedbackStore";
import { eventBus } from "@/core/eventBus";

type FeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  type: FeedbackType;
  context?: string; // Context information for the feedback
};

export default function FeedbackModal({
  isOpen,
  onClose,
  type,
  context,
}: FeedbackModalProps) {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const { addFeedback } = useFeedbackStore();

  const handleSubmit = () => {
    if (score === null) {
      return;
    }

    addFeedback({
      type,
      payload: { context },
      score,
      comment: comment.trim() || undefined,
    });

    // Emit feedback event
    eventBus.emit("feedback:submitted", {
      type,
      score,
      comment,
      context,
    });

    // Reset and close
    setScore(null);
    setComment("");
    onClose();
  };

  const handleClose = () => {
    setScore(null);
    setComment("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="rounded-2xl border border-cyan-700/50 bg-[#0A0F12]/95 p-6 w-[420px] text-gray-100 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-cyan-300 font-medium">Feedback</h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-cyan-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {context && <p className="text-sm text-gray-400 mb-4">{context}</p>}

            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">How was this?</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setScore(1)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    score === 1
                      ? "bg-emerald-600/70 text-white"
                      : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                  }`}
                >
                  <ThumbsUp size={18} />
                  Good
                </button>
                <button
                  onClick={() => setScore(-1)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    score === -1
                      ? "bg-red-600/70 text-white"
                      : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                  }`}
                >
                  <ThumbsDown size={18} />
                  Poor
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">
                Optional comment:
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us more..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-cyan-700/30 text-gray-100 text-sm focus:outline-none focus:border-cyan-500/50"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={handleClose}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-cyan-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={score === null}
                className="px-4 py-1.5 text-sm rounded-md bg-cyan-600/70 hover:bg-cyan-500/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Submit
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// TODO: Attach AI learning weights after Explain evaluation

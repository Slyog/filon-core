// FILON v4: ContextMenu updated for goal-based structure
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ContextMenuProps {
  goalId?: string;
  stepId?: string;
  closeMenu: () => void;
}

export default function ContextMenu({
  goalId,
  stepId,
  closeMenu,
}: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleDelete = async () => {
    if (!goalId && !stepId) return;

    try {
      if (goalId) {
        const response = await fetch(`/api/goals/${goalId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete goal");
        }
      } else if (stepId) {
        const response = await fetch(`/api/steps/${stepId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to delete step");
        }
      }
      closeMenu();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="absolute z-50 rounded-lg border border-cyan-500/20 bg-surface-base/95 p-2 shadow-lg backdrop-blur-xl"
          style={{ right: 0, top: 0 }}
        >
          <button
            onClick={handleDelete}
            className="w-full rounded px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/20 transition"
          >
            Delete {goalId ? "Goal" : "Step"}
          </button>
          <button
            onClick={closeMenu}
            className="w-full rounded px-3 py-2 text-left text-sm text-cyan-300 hover:bg-cyan-500/20 transition mt-1"
          >
            Close
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

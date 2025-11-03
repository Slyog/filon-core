"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useFeedbackStore } from "@/store/FeedbackStore";

export default function FeedbackToast() {
  const { items } = useFeedbackStore();
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] space-y-2">
      <AnimatePresence>
        {items.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className={`px-4 py-2 rounded-xl text-sm shadow-md ${
              f.type === "success"
                ? "bg-[rgba(47,243,255,0.1)] text-[var(--accent)]"
                : f.type === "error"
                ? "bg-[rgba(255,60,60,0.1)] text-red-400"
                : "bg-[rgba(255,255,255,0.05)] text-[var(--foreground)]"
            }`}
          >
            {f.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useFeedbackStore } from "@/store/FeedbackStore";

export default function FeedbackToast() {
  const events = useFeedbackStore((s) => s.events);
  // Show only recent events (last 5)
  const recentEvents = events.slice(-5);

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[150] space-y-2">
      <AnimatePresence>
        {recentEvents.map((f) => {
          const message = f.payload?.message || String(f.payload || "");
          const isError = f.payload?.error || f.type === "sync_failed";
          const isSuccess =
            f.type === "sync_success" || f.type === "node_added";

          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
              className={`px-4 py-2 rounded-xl text-sm shadow-md ${
                isSuccess
                  ? "bg-[rgba(47,243,255,0.1)] text-[var(--accent)]"
                  : isError
                  ? "bg-[rgba(255,60,60,0.1)] text-red-400"
                  : "bg-[rgba(255,255,255,0.05)] text-[var(--foreground)]"
              }`}
            >
              {message}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

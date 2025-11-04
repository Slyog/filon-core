"use client";

import { useFeature } from "@/config/featureFlags";

export default function ContextStream() {
  const enabled = useFeature("CONTEXT_STREAM");
  if (!enabled) return null;

  return (
    <div className="p-4 border border-cyan-400/30 rounded-2xl shadow-inner">
      <p className="text-cyan-300">Context Stream Active</p>
    </div>
  );
}

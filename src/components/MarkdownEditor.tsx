"use client";

import { useState, useEffect } from "react";
import localforage from "localforage";
import { useGoalState } from "@/hooks/useGoalState";

export default function MarkdownEditor() {
  const { currentGoal, activeStepId } = useGoalState();
  const [content, setContent] = useState("");

  // Load note when step changes
  useEffect(() => {
    if (!activeStepId) return;
    localforage.getItem(`note-${activeStepId}`).then((saved) => {
      setContent((saved as string) || "");
    });
  }, [activeStepId]);

  // Save changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (activeStepId) {
      localforage.setItem(`note-${activeStepId}`, newContent);
    }
  };

  if (!currentGoal) {
    return (
      <div className="bg-[#1e1e1e] p-4 rounded-xl text-white">
        <p className="text-gray-400">No goal selected</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1e1e1e] p-4 rounded-xl text-white">
      <textarea
        className="w-full h-40 bg-[#2d2d2d] text-white p-2 rounded-lg resize-none"
        placeholder={`Note for step ${activeStepId || "…"}`}
        value={content}
        onChange={handleChange}
      />
    </div>
  );
}

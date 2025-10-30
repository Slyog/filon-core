"use client";

import { useState, useEffect, useContext } from "react";
import localforage from "localforage";
import { useActiveNode } from "@/context/ActiveNodeContext";
import { GraphContext } from "@/components/GraphCanvas.client";

export default function MarkdownEditor() {
  const { activeNodeId } = useActiveNode();
  const graph = useContext(GraphContext);
  const [content, setContent] = useState("");

  // 🔄 Notiz laden, wenn Node wechselt
  useEffect(() => {
    if (!activeNodeId) return;
    localforage.getItem(`note-${activeNodeId}`).then((saved) => {
      setContent((saved as string) || "");
    });
  }, [activeNodeId]);

  // 💾 Änderungen speichern
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (activeNodeId && graph) {
      graph.updateNodeNote(activeNodeId, newContent);
      localforage.setItem(`note-${activeNodeId}`, newContent);
    }
  };

  return (
    <div className="bg-[#1e1e1e] p-4 rounded-xl text-white">
      <textarea
        className="w-full h-40 bg-[#2d2d2d] text-white p-2 rounded-lg resize-none"
        placeholder={`Notiz zu Node ${activeNodeId || "…"}`}
        value={content}
        onChange={handleChange}
      />
    </div>
  );
}

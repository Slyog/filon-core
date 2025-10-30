"use client";

import { useEffect, useState, useCallback } from "react";
import localforage from "localforage";
import ReactMarkdown from "react-markdown";
import { useActiveNode } from "@/context/ActiveNodeContext";

export default function ThoughtPanel() {
  const { activeNodeId } = useActiveNode();
  const [note, setNote] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // --- Notiz laden ---
  useEffect(() => {
    if (!activeNodeId) return;
    (async () => {
      const saved = await localforage.getItem<string>(`note-${activeNodeId}`);
      setNote(saved || "");
    })();
  }, [activeNodeId]);

  // --- Autosave ---
  const saveNote = useCallback(
    async (value: string) => {
      if (!activeNodeId) return;
      await localforage.setItem(`note-${activeNodeId}`, value);
    },
    [activeNodeId]
  );

  // --- Input handler ---
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNote(value);
    saveNote(value);
  };

  if (!activeNodeId) return null;

  return (
    <aside className="fixed right-0 top-0 h-full w-80 bg-[#0f172a]/95 border-l border-zinc-700 p-4 text-white z-[9999] backdrop-blur-md shadow-lg flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">🧠 Node {activeNodeId}</h2>
        <button
          onClick={() => setShowPreview((p) => !p)}
          className="text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600"
        >
          {showPreview ? "Bearbeiten" : "Vorschau"}
        </button>
      </div>

      {showPreview ? (
        <div className="overflow-y-auto prose prose-invert max-w-none">
          <ReactMarkdown>{note || "_(leer)_"}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          value={note}
          onChange={handleChange}
          placeholder="✏️ Schreibe deine Gedanken hier … (Markdown unterstützt)"
          className="flex-1 bg-zinc-800 text-sm text-white rounded-md p-3 resize-none outline-none border border-zinc-700 focus:border-sky-400"
        />
      )}
    </aside>
  );
}

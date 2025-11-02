"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import localforage from "localforage";
import ReactMarkdown from "react-markdown";
import { useActiveNode } from "@/context/ActiveNodeContext";

export default function ThoughtPanel({
  isForcedOpen,
  onPanelClose,
}: {
  isForcedOpen?: boolean;
  onPanelClose?: () => void;
} = {}) {
  const { activeNodeId, setActiveNodeId } = useActiveNode();
  const [note, setNote] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

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

  const handleClose = useCallback(() => {
    onPanelClose?.();
  }, [onPanelClose]);

  // --- Hotkeys: Esc schließt Panel, Ctrl+S/Cmd+S speichert ---
  useEffect(() => {
    if (!activeNodeId) return;
    const onKey = (e: KeyboardEvent) => {
      // Escape schließt Panel
      if (e.key === "Escape") {
        e.preventDefault();
        setActiveNodeId(null);
        handleClose();
        return;
      }
      // Ctrl+S / Cmd+S speichert (Browser-Save verhindern)
      if ((e.key === "s" || e.key === "S") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveNote(note);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeNodeId, note, setActiveNodeId, saveNote, handleClose]);

  // --- Autofokus: Editor fokussieren, wenn Panel geöffnet wird ---
  useEffect(() => {
    if (activeNodeId && editorRef.current && !showPreview) {
      // Leichter Delay, damit Animation zuerst läuft
      const t = setTimeout(() => editorRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [activeNodeId, showPreview]);

  if (!activeNodeId) return null;

  return (
    <aside
      className="fixed right-0 top-0 h-full w-80 bg-filon-surface/95 border-l border-zinc-700 p-md text-filon-text z-[9999] backdrop-blur-md shadow-lg flex flex-col transition-all duration-medium"
      role="dialog"
      aria-label="Thought Node Details"
      aria-description="Shows details and notes for the selected thought node"
    >
      <div className="flex justify-between items-center mb-md">
        <h2 className="text-lg font-semibold">🧠 Node {activeNodeId}</h2>
        <button
          onClick={() => setShowPreview((p) => !p)}
          className="text-xs px-sm py-xs rounded bg-zinc-700 hover:bg-zinc-600 transition-all duration-fast"
          aria-label={
            showPreview ? "Switch to edit mode" : "Switch to preview mode"
          }
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
          ref={editorRef}
          value={note}
          onChange={handleChange}
          placeholder="✏️ Schreibe deine Gedanken hier … (Markdown unterstützt)"
          className="flex-1 bg-zinc-800 text-sm text-white rounded-md p-3 resize-none outline-none border border-zinc-700 focus:border-sky-400"
        />
      )}
    </aside>
  );
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import localforage from "localforage";
import ReactMarkdown from "react-markdown";
import { useActiveNode } from "@/context/ActiveNodeContext";

export default function ThoughtPanel({
  isForcedOpen: _isForcedOpen,
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

  return (
    <AnimatePresence>
      {activeNodeId && (
        <motion.aside
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ duration: 0.65, ease: [0.4, 0.0, 0.2, 1] }}
          className="fixed right-0 top-0 z-[150] flex h-full w-80 flex-col border-l border-zinc-700 bg-filon-surface/95 p-md text-filon-text shadow-lg backdrop-blur-md"
          role="dialog"
          aria-label="Thought Node Details"
        >
          <div className="mb-md flex items-center justify-between">
            <h2 className="text-lg font-semibold">🧠 Node {activeNodeId}</h2>
            <button
              onClick={() => setShowPreview((p) => !p)}
              className="focus-glow rounded bg-zinc-700 px-sm py-xs text-xs transition-all duration-fast hover:bg-zinc-600"
              aria-label={
                showPreview ? "Switch to edit mode" : "Switch to preview mode"
              }
            >
              {showPreview ? "Bearbeiten" : "Vorschau"}
            </button>
          </div>

          {showPreview ? (
            <div className="prose prose-invert max-w-none overflow-y-auto">
              <ReactMarkdown>{note || "_(leer)_"}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              ref={editorRef}
              value={note}
              onChange={handleChange}
              placeholder="✏️ Schreibe deine Gedanken hier … (Markdown unterstützt)"
              className="focus-glow flex-1 resize-none rounded-md border border-zinc-700 bg-zinc-800 p-3 text-sm text-white outline-none"
            />
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SnapshotTagEditorProps {
  snapshotId: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function SnapshotTagEditor({
  snapshotId,
  tags,
  onChange,
}: SnapshotTagEditorProps) {
  const [localTags, setLocalTags] = useState<string[]>(tags);
  const [newTag, setNewTag] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local tags when external tags change
  useEffect(() => {
    setLocalTags(tags);
  }, [tags]);

  // Debounced save to parent
  const saveTags = useCallback(
    (updatedTags: string[]) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onChange(updatedTags);
      }, 500);
    },
    [onChange]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTag = newTag.trim().toLowerCase();
    if (!trimmedTag) return;

    // Check for duplicates
    if (localTags.includes(trimmedTag)) {
      setNewTag("");
      return;
    }

    const updated = [...localTags, trimmedTag];
    setLocalTags(updated);
    setNewTag("");
    saveTags(updated);
  };

  const handleRemoveTag = (tag: string) => {
    const updated = localTags.filter((t) => t !== tag);
    setLocalTags(updated);
    saveTags(updated);
  };

  return (
    <div className="mt-2">
      {/* Existing Tags */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        <AnimatePresence mode="popLayout">
          {localTags.map((tag) => (
            <motion.div
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-900/40 border border-cyan-500/30 rounded-lg text-xs text-cyan-300 group hover:border-cyan-400/60 transition-colors"
              style={{ boxShadow: "0 0 8px rgba(59, 130, 246, 0.15)" }}
            >
              <span>{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-cyan-400 hover:text-cyan-200 transition-colors ml-0.5"
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Tag Input */}
      <form onSubmit={handleAddTag} className="relative">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Add tag..."
          className="w-full px-2 py-1 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white text-xs placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50"
        />
      </form>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import localforage from "localforage";

export default function LocalSearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    async function searchNote() {
      const content = await localforage.getItem<string>("noion-note");
      if (content && query.trim().length > 0) {
        const lower = query.toLowerCase();
        const match = content
          .split("\n")
          .filter((line) => line.toLowerCase().includes(lower))
          .join("\n");
        setResult(match || "❌ Keine Treffer gefunden.");
      } else {
        setResult(null);
      }
    }
    searchNote();
  }, [query]);

  return (
    <div className="p-4 border-t border-zinc-800 mt-6">
      <input
        type="text"
        placeholder="🔍 Suchbegriff eingeben..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-3 rounded-lg bg-noion-muted text-white outline-none"
      />
      {result && (
        <pre className="mt-3 p-3 rounded-lg bg-noion-dark text-zinc-200 overflow-auto whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
}

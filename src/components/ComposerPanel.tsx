"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { SendHorizonal, Mic, Upload } from "lucide-react";
import { useSessionStore } from "@/store/SessionStore";
import { useFeedbackStore } from "@/store/FeedbackStore";

const TYPES = [
  "Idea",
  "Knowledge",
  "Guide",
  "Inspiration",
  "Reflection",
  "Custom",
] as const;

type ComposerType = (typeof TYPES)[number];

export default function ComposerPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const createOrGetActive = useSessionStore((s) => s.createOrGetActive);
  const enqueueThought = useSessionStore((s) => s.enqueueThought);
  const generateTitleFromThought = useSessionStore(
    (s) => s.generateTitleFromThought
  );
  const addFeedback = useFeedbackStore((s) => s.addFeedback);

  const [selectedType, setSelectedType] = useState<ComposerType>("Idea");
  const [customType, setCustomType] = useState("");
  const [text, setText] = useState("");

  const effectiveType = useMemo(() => {
    if (selectedType === "Custom") {
      return customType.trim() || "Custom";
    }
    return selectedType;
  }, [selectedType, customType]);

  const canSubmit = text.trim().length > 0;

  const waitForGraph = useCallback(async () => {
    for (let i = 0; i < 20; i += 1) {
      if (useSessionStore.getState().graphLoadedOnce) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return false;
  }, []);

  const handleConfirm = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      addFeedback({
        type: "user_action",
        payload: { message: "Bitte zuerst Text eingeben.", error: true },
      });
      return;
    }

    const titleSuggestion = generateTitleFromThought(trimmed);
    const sessionId = await createOrGetActive(titleSuggestion);
    if (!sessionId) {
      addFeedback({
        type: "user_action",
        payload: {
          message: "⚠️ Workspace konnte nicht erstellt werden.",
          error: true,
        },
      });
      return;
    }

    if (!pathname?.includes(`/f/${sessionId}`)) {
      router.push(`/f/${sessionId}`);
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    const ready = await waitForGraph();
    enqueueThought({
      sessionId,
      content: trimmed,
      thoughtType: effectiveType,
    });

    addFeedback({
      type: "user_action",
      payload: {
        message:
          "✨ Thought wird hinzugefügt, sobald der Workspace bereit ist.",
      },
    });
    addFeedback({
      type: "node_added",
      payload: { message: "🧠 Thought in den Workspace übernommen." },
    });

    if (!ready) {
      console.warn(
        "GraphCanvas not ready after waiting; thought remains queued until drain runs."
      );
    }

    setText("");
    if (selectedType === "Custom") {
      setCustomType("");
    }
  }, [
    addFeedback,
    createOrGetActive,
    effectiveType,
    enqueueThought,
    generateTitleFromThought,
    pathname,
    router,
    selectedType,
    text,
    waitForGraph,
  ]);

  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-lg">
      <div className="flex flex-wrap gap-2">
        {TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setSelectedType(type)}
            className={`rounded-full px-3 py-1 text-sm transition ${
              type === selectedType
                ? "bg-cyan-500/20 text-cyan-300"
                : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {selectedType === "Custom" && (
        <input
          className="mt-3 w-full rounded-lg border border-zinc-800 bg-black/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-cyan-500"
          placeholder="Custom type…"
          value={customType}
          onChange={(event) => setCustomType(event.target.value)}
        />
      )}

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Schreibe deinen Thought… (Enter oder Button zum Bestätigen)"
          className="min-h-[120px] flex-1 rounded-2xl border border-zinc-800 bg-black/70 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-cyan-500"
        />
        <div className="flex w-full flex-row gap-2 lg:w-auto lg:flex-col">
          <button
            type="button"
            disabled
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-500"
            title="Voice Input (bald verfügbar)"
          >
            <Mic size={16} />
            Voice
          </button>
          <button
            type="button"
            disabled
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-500"
            title="Upload (bald verfügbar)"
          >
            <Upload size={16} />
            Upload
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              canSubmit
                ? "bg-cyan-500 text-black hover:bg-cyan-400"
                : "bg-zinc-800 text-zinc-500"
            }`}
          >
            <SendHorizonal size={16} />
            Confirm
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Beim ersten Confirm wird automatisch ein Workspace erstellt.
      </p>
    </div>
  );
}

"use client";

import { useRouter, usePathname } from "next/navigation";
import { useMemo, useState, useCallback } from "react";
import { useFeedbackStore } from "@/store/FeedbackStore";
import { useSessionStore } from "@/store/SessionStore";
import { useGraphStore } from "@/store/GraphStore";

const TYPES = [
  "Idea",
  "Knowledge",
  "Guide",
  "Inspiration",
  "Reflection",
  "Custom",
] as const;

export default function ThoughtTypeSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const addFeedback = useFeedbackStore((s) => s.add);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const createOrGetActive = useSessionStore((s) => s.createOrGetActive);
  const generateTitleFromThought = useSessionStore(
    (s) => s.generateTitleFromThought
  );
  const enqueueThought = useSessionStore((s) => s.enqueueThought);
  const waitForGraphReady = useCallback(async () => {
    for (let i = 0; i < 20; i += 1) {
      if (useGraphStore.getState().graphLoadedOnce) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return false;
  }, []);

  const [selected, setSelected] = useState<(typeof TYPES)[number]>("Idea");
  const [custom, setCustom] = useState("");
  const [text, setText] = useState("");

  const currentType = useMemo(() => {
    if (selected === "Custom") {
      return custom.trim() || "Custom";
    }
    return selected;
  }, [selected, custom]);

  const canConfirm = text.trim().length > 0;

  async function handleConfirm() {
    if (!canConfirm) {
      addFeedback({
        type: "error",
        message: "Bitte zuerst Text eingeben.",
      });
      return;
    }

    const content = text.trim();

    const previousSessionId = activeSessionId;
    const titleSuggestion = generateTitleFromThought(content);
    const sessionId = await createOrGetActive(titleSuggestion);

    if (!sessionId) {
      addFeedback({
        type: "error",
        message: "⚠️ Could not create workspace automatically.",
      });
      return;
    }

    if (!pathname.includes(`/f/${sessionId}`)) {
      router.push(`/f/${sessionId}`);
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    const graphReady = await waitForGraphReady();
    if (!graphReady) {
      console.warn(
        "Graph not ready after waiting; thoughts remain queued until drain runs"
      );
    }

    enqueueThought({
      sessionId,
      content,
      thoughtType: currentType,
    });
    addFeedback({
      type: "info",
      message: "✨ Thought queued — will appear once workspace is ready.",
    });

    setText("");
    if (selected === "Custom") {
      setCustom("");
    }

    const createdNewWorkspace =
      !previousSessionId || previousSessionId !== sessionId;

    addFeedback({
      type: "success",
      message: createdNewWorkspace
        ? "✨ Workspace erstellt und Thought wird hinzugefügt…"
        : "🧠 Thought wird hinzugefügt…",
    });
  }

  return (
    <div className="mt-2">
      <div className="flex gap-2 flex-wrap">
        {TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setSelected(type)}
            className={
              "px-2 py-1 rounded border transition-colors " +
              (type === selected
                ? "border-cyan-400 text-cyan-300 bg-cyan-900/20"
                : "border-zinc-600 text-zinc-300 hover:border-cyan-400/60")
            }
          >
            {type}
          </button>
        ))}
      </div>

      {selected === "Custom" && (
        <input
          className="mt-2 w-full rounded border border-zinc-600 bg-black/50 px-2 py-1 text-zinc-100"
          placeholder="Custom type…"
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
        />
      )}

      <div className="mt-2 flex items-center gap-2">
        <input
          className="flex-1 rounded border border-zinc-600 bg-black/50 px-2 py-1 text-zinc-100"
          placeholder="write your thought… (Enter to confirm)"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && canConfirm) {
              event.preventDefault();
              void handleConfirm();
            }
          }}
        />
        <button
          type="button"
          disabled={!canConfirm}
          onClick={handleConfirm}
          className={
            "px-3 py-1 rounded font-medium transition-colors " +
            (canConfirm
              ? "bg-cyan-600 hover:bg-cyan-500 text-black"
              : "bg-zinc-700 text-zinc-400 cursor-not-allowed")
          }
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

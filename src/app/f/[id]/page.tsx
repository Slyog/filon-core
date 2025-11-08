"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import GraphCanvas from "@/components/GraphCanvas.client";
import { useSessionStore } from "@/store/SessionStore";

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const enqueueThought = useSessionStore((state) => state.enqueueThought);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!id || typeof window === "undefined") return;

    const titleKey = `workspaceTitle:${id}`;
    const storedTitle = window.localStorage.getItem(titleKey)?.trim() ?? null;
    document.title = storedTitle ? `FILON - ${storedTitle}` : "FILON";

    try {
      window.localStorage.setItem("lastWorkspaceId", id);
    } catch (_error) {
      // Ignore storage limitations
    }

    const now = Date.now();
    const store = useSessionStore.getState();
    const existing = store.sessions.find((session) => session.id === id);

    if (!existing) {
      store.openSession({
        id,
        title: storedTitle || "Untitled Workspace",
        createdAt: now,
        updatedAt: now,
      });
    } else if (storedTitle && existing.title !== storedTitle) {
      store.updateSessionTitle(id, storedTitle);
    }

    store.setActiveSession(id);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (initialized) return;

    const q = searchParams.get("q");
    const trimmed = q?.trim();
    if (!trimmed) return;

    enqueueThought({
      sessionId: id,
      content: trimmed,
      thoughtType: "Idea",
    });
    setInitialized(true);

    if (typeof window !== "undefined") {
      const titleKey = `workspaceTitle:${id}`;
      try {
        const currentTitle = window.localStorage.getItem(titleKey);
        if (!currentTitle) {
          window.localStorage.setItem(titleKey, trimmed);
        }
        document.title = `FILON - ${trimmed}`;
      } catch (_error) {
        // Ignore storage limitations
      }
    }

    const store = useSessionStore.getState();
    const existing = store.sessions.find((session) => session.id === id);
    if (!existing) {
      const now = Date.now();
      store.openSession({
        id,
        title: trimmed,
        createdAt: now,
        updatedAt: now,
      });
    } else if (existing.title !== trimmed) {
      store.updateSessionTitle(id, trimmed);
    }
  }, [id, searchParams, enqueueThought, initialized]);

  if (!id) {
    return null;
  }

  return <GraphCanvas sessionId={id} />;
}

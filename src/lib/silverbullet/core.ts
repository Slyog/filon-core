import { createContext, useContext, useEffect, useState } from "react";

/**
 * Silverbullet-Core: zentrale Steuerung kommender Merge-Strategien.
 * Später: Realtime WebSocket-Bridge, User-Prioritäten, Undo-Stacks.
 */
export interface MergeEvent {
  type: "merge" | "conflict" | "commit";
  payload?: any;
  timestamp: number;
}

export const SilverbulletCore = {
  events: [] as MergeEvent[],
  log(event: MergeEvent) {
    this.events.push(event);
    console.info("[Silverbullet]", event);
    // Dispatch CustomEvent für UI-Feedback
    window.dispatchEvent(new CustomEvent("silverbullet", { detail: event }));
  },
};

export const SilverbulletContext = createContext<{ event?: string }>({});

export function useSilverbullet() {
  return useContext(SilverbulletContext);
}

// optionaler Hook für UI-Feedback
export function useMergeFeedback() {
  const [state, setState] = useState<string>("saved");
  useEffect(() => {
    const handle = (e: any) => {
      if (e.detail?.type === "merge") setState("merged");
      if (e.detail?.type === "conflict") setState("conflict");
      if (e.detail?.type === "commit") setState("saved");
    };
    window.addEventListener("silverbullet", handle);
    return () => window.removeEventListener("silverbullet", handle);
  }, []);
  return state;
}

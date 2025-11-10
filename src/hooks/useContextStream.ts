import { useEffect, useState } from "react";

export interface StreamEntry {
  id: string;
  type: "intent" | "node" | "system";
  title: string;
  detail?: string;
  time: string;
}

export function useContextStream() {
  const [entries, setEntries] = useState<StreamEntry[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleIntent = (event: Event) => {
      const e = event as CustomEvent<{ title: string; detail: string }>;
      setEntries((prev) => [
        ...prev,
        {
          id: `intent-${Date.now()}`,
          type: "intent",
          title: e.detail.title,
          detail: e.detail.detail,
          time: new Date().toLocaleTimeString(),
        },
      ]);
    };

    const handleNode = (event: Event) => {
      const e = event as CustomEvent<{ id: string; label: string }>;
      setEntries((prev) => [
        ...prev,
        {
          id: e.detail.id,
          type: "node",
          title: `🧩 Created Node: ${e.detail.label}`,
          time: new Date().toLocaleTimeString(),
        },
      ]);
    };

    window.addEventListener("filon:intent-result", handleIntent as EventListener);
    window.addEventListener("filon:create-node", handleNode as EventListener);

    return () => {
      window.removeEventListener(
        "filon:intent-result",
        handleIntent as EventListener,
      );
      window.removeEventListener(
        "filon:create-node",
        handleNode as EventListener,
      );
    };
  }, []);

  return entries;
}


"use client";
import { useSessionStore } from "@/store/SessionStore";
import { useRouter } from "next/navigation";
import GraphPreview from "./GraphPreview";

export default function Sidebar() {
  const {
    sessions,
    addSession,
    removeSession,
    activeSessionId,
    setActiveSession,
  } = useSessionStore();
  const router = useRouter();

  const handleNew = () => {
    const id = addSession();
    router.push(`/graph/${id}`);
  };

  const handleOpen = (id: string) => {
    setActiveSession(id);
    router.push(`/graph/${id}`);
  };

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-[rgba(10,15,18,0.9)] border-r border-[var(--border-glow)] text-[var(--foreground)] flex flex-col p-4 space-y-4 z-40">
      <h2 className="text-[var(--accent)] font-semibold mb-2">Workspaces</h2>

      <button
        onClick={handleNew}
        className="w-full px-4 py-2 bg-[var(--accent)] text-black rounded-lg hover:opacity-90 transition"
      >
        ➕ New Graph
      </button>

      <div className="flex-1 overflow-y-auto space-y-2">
        {sessions.length === 0 ? (
          <p className="opacity-60 text-sm mt-2">No graphs yet.</p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => handleOpen(s.id)}
              className={`cursor-pointer p-2 rounded-lg border transition ${
                s.id === activeSessionId
                  ? "border-[var(--accent)]"
                  : "border-transparent hover:border-[rgba(47,243,255,0.25)]"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span>{s.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSession(s.id);
                  }}
                  className="opacity-50 hover:opacity-100"
                >
                  ✕
                </button>
              </div>

              {s.meta && (
                <p className="text-xs opacity-70 mb-1">
                  {s.meta.nodeCount} nodes • {s.meta.edgeCount} edges •{" "}
                  {new Date(s.meta.lastSaved).toLocaleTimeString()}
                </p>
              )}

              <GraphPreview nodes={[]} edges={[]} />
            </div>
          ))
        )}
      </div>

      <hr className="opacity-30 my-3" />
      <h3 className="text-sm font-semibold text-[var(--accent)]">
        Import / Export
      </h3>

      <div className="flex gap-2">
        <button
          onClick={async () => {
            const store = useSessionStore.getState();
            const active = store.activeSessionId;
            if (!active) {
              alert("No active graph.");
              return;
            }
            try {
              const storage = await import("@/lib/sessionStorage");
              const { loadGraphFromSession } = storage;
              const graph = await loadGraphFromSession(active);
              const io = await import("@/lib/graphIO");
              io.downloadJSON(
                io.exportGraphJSON(graph.nodes, graph.edges),
                `filon-${active}.json`
              );
            } catch (error) {
              console.error("Export error:", error);
              alert(
                `Failed to export graph: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`
              );
            }
          }}
          className="flex-1 px-2 py-1 bg-[var(--accent)] text-black rounded-md text-sm hover:opacity-90"
        >
          ⬇ Export
        </button>

        <label className="flex-1 px-2 py-1 border border-[var(--accent)] rounded-md text-center text-sm cursor-pointer hover:bg-[rgba(47,243,255,0.1)]">
          ⬆ Import
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const io = await import("@/lib/graphIO");
                const { nodes, edges } = await io.importGraphJSON(file);
                const { activeSessionId } = useSessionStore.getState();
                if (!activeSessionId) {
                  alert("No active session. Please open a graph first.");
                  e.target.value = ""; // Clear file input
                  return;
                }
                const storage = await import("@/lib/sessionStorage");
                await storage.saveGraphToSession(activeSessionId, {
                  nodes,
                  edges,
                });
                e.target.value = ""; // Clear file input
                location.reload();
              } catch (error) {
                console.error("Import error:", error);
                alert(
                  `Failed to import graph: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`
                );
                e.target.value = ""; // Clear file input on error
              }
            }}
          />
        </label>
      </div>
    </aside>
  );
}

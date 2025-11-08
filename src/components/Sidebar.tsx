"use client";
import { useState, useMemo } from "react";
import { useSessionStore, type Session } from "@/store/SessionStore";
import { useRouter } from "next/navigation";
import GraphPreview from "./GraphPreview";
import QAPanel from "./QAPanel";
import { useUIShellStore } from "@/store/UIShellStore";

export default function Sidebar() {
  const {
    sessions,
    addSession,
    removeSession,
    setActiveSession,
    activeSessionId,
  } = useSessionStore();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Session["category"] | "All">("All");
  const [qaPanelOpen, setQaPanelOpen] = useState(false);
  const sidebarOpen = useUIShellStore((state) => state.sidebarOpen);

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch = s.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter =
        filter === "All" ||
        s.category === filter ||
        (filter === "Other" && !s.category); // Include undefined categories in "Other"
      return matchesSearch && matchesFilter;
    });
  }, [sessions, search, filter]);

  const handleNew = () => {
    const name = window.prompt("Name of new workspace:");
    if (!name || name.trim() === "") {
      return; // User cancelled or left blank
    }
    const id = crypto.randomUUID();
    const store = useSessionStore.getState();

    // Prevent duplicate creation
    const existing = store.sessions.find((s) => s.id === id);
    if (existing) {
      alert("Session with this ID already exists.");
      return;
    }

    store.openSession({
      id,
      title: name.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    localStorage.setItem("lastSessionAt", Date.now().toString());
    router.push(`/f/${id}`);
  };

  const handleOpen = (id: string) => {
    setActiveSession(id);
    localStorage.setItem("lastSessionAt", Date.now().toString());
    router.push(`/f/${id}`);
  };

  return (
    <aside
      className="fixed left-0 top-0 z-30 flex h-full flex-col border-r border-cyan-400/10 bg-[#0A0F12]/95 p-4 transition-all duration-300 scrollbar text-[var(--foreground)]"
      style={{ width: sidebarOpen ? "256px" : "80px" }}
    >
      <h2 className="text-[var(--accent)] font-semibold mb-3">Workspaces</h2>

      <button
        onClick={handleNew}
        className="w-full px-4 py-2 bg-[var(--accent)] text-black rounded-lg hover:opacity-90 transition mb-3"
      >
        ➕ New Graph
      </button>

      {/* Search Bar */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="w-full px-3 py-1 rounded-md bg-[rgba(255,255,255,0.05)] text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      />

      {/* Filter */}
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value as any)}
        className="w-full px-2 py-1 rounded-md bg-[rgba(255,255,255,0.05)] text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      >
        <option value="All">All Categories</option>
        <option value="Idea">Ideas</option>
        <option value="Knowledge">Knowledge</option>
        <option value="Guide">Guides</option>
        <option value="Inspiration">Inspiration</option>
        <option value="Project">Projects</option>
        <option value="Other">Other</option>
      </select>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {filtered.length === 0 && (
          <p className="opacity-60 text-xs mt-4 text-center">
            No matching graphs.
          </p>
        )}

        {filtered.map((s) => (
          <div
            key={s.id}
            role="button"
            tabIndex={0}
            aria-label={`Open workspace: ${s.title}`}
            className={`p-2 rounded-lg cursor-pointer border transition-all focus:outline-none focus:ring-2 focus:ring-filament focus:ring-offset-2 focus:ring-offset-layer ${
              s.id === activeSessionId
                ? "bg-panel text-filament font-semibold border-[var(--accent)]"
                : "border-transparent hover:shadow-[0_0_10px_rgba(47,243,255,0.4)]"
            }`}
            onClick={() => handleOpen(s.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleOpen(s.id);
              }
            }}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="truncate">{s.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeSession(s.id);
                }}
                className="text-xs opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>

            {s.category && (
              <p className="text-[10px] text-[var(--accent)] opacity-80">
                {s.category}
              </p>
            )}

            {s.meta && (
              <p className="text-[10px] opacity-60">
                {s.meta.nodeCount} nodes •{" "}
                {new Date(s.meta.lastSaved).toLocaleTimeString()}
              </p>
            )}

            <GraphPreview nodes={[]} edges={[]} />
          </div>
        ))}
      </div>

      <hr className="opacity-30 my-3" />

      {/* QA Section */}
      <button
        onClick={() => setQaPanelOpen(!qaPanelOpen)}
        className="w-full px-3 py-2 mb-2 text-sm text-left bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] rounded-md transition-colors flex items-center justify-between"
      >
        <span className="text-[var(--accent)]">🔍 QA History</span>
        <span className="text-xs opacity-60">{qaPanelOpen ? "▼" : "▶"}</span>
      </button>
      {qaPanelOpen && (
        <div className="mb-3">
          <QAPanel className="h-[400px]" />
        </div>
      )}

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

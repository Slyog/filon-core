"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/components/shell/AppShell";
import Brainbar, {
  type BrainbarCommand,
  type BrainbarHandle,
} from "@/components/Brainbar";
import QuickChips from "@/components/QuickChips";
import MiniGraph from "@/components/MiniGraph";
import ContextStream, {
  type ContextStreamItem,
} from "@/components/ContextStream";
import { useSessionStore } from "@/store/SessionStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { motion, AnimatePresence } from "framer-motion";
import { t } from "@/config/strings";

const INITIAL_STREAM: ContextStreamItem[] = [
  {
    id: "seed-1",
    title: "Launch Brainbar Concept",
    summary:
      "Synthesis of the latest Brainbar inputs. Focus on clear commands, minimal distraction, and instant linking.",
    confidence: 92,
    ts: Date.now() - 1000 * 60 * 2,
  },
  {
    id: "seed-2",
    title: "Mini-Graph Refresh",
    summary:
      "The latest connections show up as a compact ReactFlow preview so you can spot structure trends fast.",
    confidence: 88,
    ts: Date.now() - 1000 * 60 * 7,
  },
  {
    id: "seed-3",
    title: "Context Stream Focus",
    summary:
      "The stream uses virtualization to render 200+ entries smoothly while keeping keyboard navigation responsive.",
    confidence: 85,
    ts: Date.now() - 1000 * 60 * 17,
  },
];

const INITIAL_NODES = [
  { id: "seed-1", label: "Brainbar Konzept" },
  { id: "seed-2", label: "Mini Graph" },
  { id: "seed-3", label: "Context Stream" },
];

const INITIAL_EDGES = [
  { id: "seed-edge-1", source: "seed-1", target: "seed-2" },
  { id: "seed-edge-2", source: "seed-2", target: "seed-3" },
];

export default function Home() {
  const setActiveSession = useSessionStore((state) => state.setActiveSession);
  const [streamItems, setStreamItems] =
    useState<ContextStreamItem[]>(INITIAL_STREAM);
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges, setEdges] = useState(INITIAL_EDGES);
  const [hoveredId, setHoveredId] = useState<string | undefined>();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const brainbarRef = useRef<BrainbarHandle>(null);
  const previousNodeRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setActiveSession(null);
    if (typeof document !== "undefined") {
      document.title = "FILON – Gedankengraph";
    }
  }, [setActiveSession]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSubmit = useCallback(
    (command: BrainbarCommand) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        const id = `ctx-${Date.now()}`;
        const summaryText =
          command.text ||
          (command.type === "goal"
            ? t.newGoalPlanned
            : t.newThoughtSpark);
        const title =
          summaryText.length > 48
            ? `${summaryText.slice(0, 45)}…`
            : summaryText;
        const confidence =
          command.type === "goal" ? 95 : command.type === "due" ? 87 : 90;

        previousNodeRef.current = nodes[nodes.length - 1]?.id ?? null;

        setStreamItems((items) =>
          [
            { id, title, summary: summaryText, confidence, ts: Date.now() },
            ...items,
          ].slice(0, 300)
        );

        setNodes((prev) => [...prev.slice(-19), { id, label: title }]);

        setEdges((prev) => {
          const source = previousNodeRef.current;
          if (!source) return prev;
          return [
            ...prev.slice(-19),
            {
              id: `edge-${Date.now()}`,
              source,
              target: id,
            },
          ];
        });

        setHoveredId(id);
      }, 200);
    },
    [nodes]
  );

  const focusBrainbar = useCallback(() => {
    brainbarRef.current?.focus();
  }, []);

  const togglePalette = useCallback(() => {
    setCommandPaletteOpen((open) => !open);
  }, []);

  const shortcuts = useMemo(
    () => [
      { key: "n", ctrl: true, handler: focusBrainbar, allowInInputs: true },
      { key: "n", meta: true, handler: focusBrainbar, allowInInputs: true },
      { key: "k", ctrl: true, handler: togglePalette, allowInInputs: true },
      { key: "k", meta: true, handler: togglePalette, allowInInputs: true },
    ],
    [focusBrainbar, togglePalette]
  );

  useKeyboardShortcuts(shortcuts);

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-text-secondary/70">
            Filon · Works without connection
          </p>
          <h1 className="text-3xl font-semibold text-text-primary">
            Brainbar · Context Stream
          </h1>
        </header>

        <section className="flex flex-col gap-4 rounded-3xl border border-cyan-400/10 bg-surface-base/60 p-6 backdrop-blur-2xl">
          <Brainbar ref={brainbarRef} onSubmit={handleSubmit} autoFocus />
          <QuickChips
            onPick={(command) => {
              brainbarRef.current?.prefill(command);
              focusBrainbar();
            }}
          />
        </section>

        <ContextStream
          items={streamItems}
          hoveredId={hoveredId}
          onSelect={(id) => setHoveredId(id)}
          onHover={(id) => setHoveredId(id ?? undefined)}
        />

        <MiniGraph
          nodes={nodes}
          edges={edges}
          onHoverNode={(id) => setHoveredId(id ?? undefined)}
        />
      </div>

      <AnimatePresence>
        {commandPaletteOpen && (
          <motion.div
            role="dialog"
            aria-modal="false"
            aria-label="Command Palette"
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 20 }}
              className="mt-24 w-full max-w-lg rounded-2xl border border-cyan-400/20 bg-surface-active/90 p-6 text-sm text-text-primary"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-cyan-100">
                  Quick Command Palette (Beta)
                </h2>
                <button
                  type="button"
                  className="text-xs text-text-secondary underline decoration-dotted"
                  onClick={() => setCommandPaletteOpen(false)}
                >
                  {t.close}
                </button>
              </div>
              <p className="text-text-secondary/80">
                {t.commandPaletteDescription}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import BackgroundStars from "@/components/BackgroundStars";
import { useUISettingsStore } from "@/store/uiSettingsStore";

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const openSidebarPeek = useUISettingsStore((state) => state.setShowSidebarPeek);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || loading) {
      return;
    }

    setLoading(true);

    const workspaceId =
      typeof window !== "undefined" &&
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `ws-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

    if (typeof window !== "undefined") {
      try {
        // Try to reuse existing workspaceId from localStorage, otherwise use new one
        const lastWorkspaceId = window.localStorage.getItem("lastWorkspaceId");
        const finalWorkspaceId = lastWorkspaceId || workspaceId;
        window.localStorage.setItem("lastWorkspaceId", finalWorkspaceId);
        router.push(`/f/${finalWorkspaceId}?q=${encodeURIComponent(trimmed)}`, {
          scroll: false,
        });
      } catch (_error) {
        // localStorage can be unavailable (private mode, storage restrictions)
        router.push(`/f/${workspaceId}?q=${encodeURIComponent(trimmed)}`, {
          scroll: false,
        });
      }
    } else {
      router.push(`/f/${workspaceId}?q=${encodeURIComponent(trimmed)}`, {
        scroll: false,
      });
    }
  };

  const confirmDisabled = loading || input.trim().length === 0;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0A0F12] text-cyan-100">
      <BackgroundStars />

      <main className="flex flex-col items-center justify-center h-screen text-center">
        <motion.div
          animate={{ opacity: [0, 1], scale: [0.95, 1] }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="flex flex-col items-center gap-4"
        >
          <h1 className="text-cyan-300 tracking-widest text-sm uppercase font-light">
            FILON
          </h1>
          <h2 className="mt-2 text-xl font-medium text-cyan-100">
            The mind that visualizes itself.
          </h2>
          <p className="mt-2 text-sm text-slate-400 tracking-wide">
            Start with a single thought. We will grow the workspace around it.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 w-full max-w-md"
            autoComplete="off"
            noValidate
          >
            <div className="group flex w-full flex-col gap-4 rounded-2xl border border-cyan-400/25 bg-white/5 p-4 text-left shadow-[0_0_28px_rgba(47,243,255,0.08)] backdrop-blur-md transition focus-within:border-cyan-300/40 focus-within:shadow-[0_0_32px_rgba(47,243,255,0.12)] sm:flex-row sm:items-center sm:gap-6">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Write a thought..."
                aria-label="Write a thought"
                className="flex-1 bg-transparent text-base font-light text-cyan-100 placeholder:text-cyan-400/45 outline-none sm:text-lg"
                disabled={loading}
                autoFocus
              />

              <div className="flex items-center justify-end gap-3 sm:justify-center">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-500/10 text-cyan-200 transition hover:border-cyan-300/40 hover:bg-cyan-500/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F12] sm:h-12 sm:w-12"
                  aria-label="Voice capture (coming soon)"
                  title="Voice capture (coming soon)"
                >
                  <MicIcon />
                </button>

                <button
                  type="submit"
                  disabled={confirmDisabled}
                  className="px-5 py-2.5 rounded-2xl bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-300/30 text-cyan-200 shadow-[0_0_12px_#2FF3FF33] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F12] disabled:cursor-not-allowed disabled:bg-cyan-400/40 disabled:opacity-50"
                >
                  {loading ? "Redirecting..." : "Confirm"}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </main>

      <button
        type="button"
        onClick={() => openSidebarPeek(true)}
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-r-full border border-cyan-400/20 bg-cyan-500/12 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-200 transition hover:border-cyan-300/40 hover:bg-cyan-500/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F12]"
        aria-label="Open workspace sidebar peek (Ctrl or Command plus K)"
      >
        Workspace
      </button>
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      className="h-5 w-5 text-cyan-200/80"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3a2.5 2.5 0 0 1 2.5 2.5v6a2.5 2.5 0 0 1-5 0v-6A2.5 2.5 0 0 1 12 3Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 11.5a7 7 0 0 1-14 0M12 18.5V21"
      />
    </svg>
  );
}

"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
        window.localStorage.setItem("lastWorkspaceId", workspaceId);
      } catch (_error) {
        // localStorage can be unavailable (private mode, storage restrictions)
      }

      try {
        window.sessionStorage.setItem("initialThought", trimmed);
      } catch (_error) {
        // sessionStorage can be unavailable; ignore silently
      }
    }

    router.push(`/f/${workspaceId}?q=${encodeURIComponent(trimmed)}`);
  };

  const confirmDisabled = loading || input.trim().length === 0;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0A0F12] text-cyan-100">
      <BackgroundStars />

      <main className="relative z-10 flex w-full max-w-3xl flex-col items-center px-6 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-cyan-400/60">
          Filon
        </p>
        <h1 className="mt-8 text-4xl font-light tracking-widest text-cyan-100 sm:text-5xl">
          The mind that visualizes itself.
        </h1>
        <p className="mt-4 max-w-xl text-sm font-light text-cyan-100/70 sm:text-base">
          Start with a single thought. We will grow the workspace around it.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-12 w-full"
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
                className="inline-flex h-11 items-center justify-center rounded-full bg-cyan-400/85 px-9 text-sm font-semibold uppercase tracking-[0.24em] text-[#0A0F12] transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F12] disabled:cursor-not-allowed disabled:bg-cyan-400/40 sm:h-12 sm:px-11"
              >
                {loading ? "Redirecting..." : "Confirm"}
              </button>
            </div>
          </div>
        </form>

        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-cyan-400/55">
          Press Enter or Confirm to create a new workspace
        </p>
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

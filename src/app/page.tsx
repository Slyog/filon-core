"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackgroundStars from "@/components/BackgroundStars";

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const lastId = window.localStorage.getItem("lastWorkspaceId");
    if (lastId) {
      router.replace(`/f/${lastId}`);
    }
  }, [router]);

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
        <p className="mt-4 max-w-xl text-sm text-cyan-100/60 sm:text-base">
          Start with a single thought. We will grow the workspace around it.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-12 w-full"
          autoComplete="off"
          noValidate
        >
          <div className="group flex w-full flex-col gap-3 rounded-2xl border border-cyan-400/20 bg-white/5 p-3 text-left shadow-[0_0_25px_rgba(47,243,255,0.08)] backdrop-blur-md transition focus-within:border-cyan-300/40 focus-within:shadow-[0_0_35px_rgba(47,243,255,0.15)] sm:flex-row sm:items-center sm:gap-4 sm:p-4">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Write a thought..."
              aria-label="Write a thought"
              className="flex-1 bg-transparent text-base text-cyan-100 placeholder-cyan-400/40 outline-none sm:text-lg"
              disabled={loading}
              autoFocus
            />

            <div className="flex items-center justify-end gap-2 sm:justify-center">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-500/10 text-cyan-200 transition hover:border-cyan-300/50 hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F12] sm:h-12 sm:w-12"
                aria-label="Voice capture (coming soon)"
                title="Voice capture (coming soon)"
              >
                <MicIcon />
              </button>

              <button
                type="submit"
                disabled={confirmDisabled}
                className="inline-flex h-11 items-center justify-center rounded-full bg-cyan-400/80 px-8 text-sm font-semibold uppercase tracking-[0.2em] text-[#0A0F12] transition hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F12] disabled:cursor-not-allowed disabled:bg-cyan-400/40 sm:h-12 sm:px-10"
              >
                {loading ? "Redirecting..." : "Confirm"}
              </button>
            </div>
          </div>
        </form>

        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-cyan-400/50">
          Press Enter or Confirm to create a new workspace
        </p>
      </main>
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

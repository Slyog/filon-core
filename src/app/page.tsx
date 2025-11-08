"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const router = useRouter();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const thought = input.trim();
    if (!thought) return;

    const workspaceId =
      typeof window !== "undefined" &&
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `ws-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("lastWorkspaceId", workspaceId);
        window.localStorage.setItem(
          `workspaceTitle:${workspaceId}`,
          thought
        );
      } catch (_error) {
        // Ignore storage restrictions
      }
    }

    router.push(`/f/${workspaceId}?q=${encodeURIComponent(thought)}`);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#0A0F12] text-cyan-200 px-6 relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-16" />

      <div className="text-center mb-8">
        <h1 className="text-cyan-300 text-sm tracking-[0.3em] font-light uppercase">
          FILON
        </h1>
        <h2 className="mt-2 text-lg font-medium text-cyan-100">
          The mind that visualizes itself.
        </h2>
        <p className="mt-3 text-sm text-cyan-400/70">
          Start with a single thought - we'll grow the workspace around it.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 w-full max-w-md"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a thought..."
          className="flex-1 bg-transparent border border-cyan-400/30 rounded-xl px-4 py-2 text-cyan-100 focus:outline-none focus:border-cyan-300 shadow-[0_0_12px_#2FF3FF22] transition-all"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-2xl bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-300/30 text-cyan-200 shadow-[0_0_12px_#2FF3FF33] transition-all"
        >
          Confirm
        </button>
      </form>

      {/* Upload hidden until implemented */}
      {/* <button className="mt-4 text-cyan-400/70 hover:text-cyan-300">Upload file</button> */}

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(47,243,255,0.04)_0%,transparent_70%)]" />
    </main>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import WorkspaceList from "@/components/WorkspaceList";
import { useSessionStore } from "@/store/SessionStore";

export default function Page() {
  const router = useRouter();
  const getLastActive = useSessionStore((s) => s.getLastActive);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);

  useEffect(() => {
    document.title = "FILON — Visual Workspace";
  }, []);

  useEffect(() => {
    const last = getLastActive();
    const lastTime = localStorage.getItem("lastSessionAt");
    const recent =
      lastTime && Date.now() - Number(lastTime) < 5 * 60_000 && Boolean(last);

    if (recent && last) {
      router.push(`/f/${last}`);
      return;
    }

    setActiveSession(null);
  }, [router, getLastActive, setActiveSession]);

  return (
    <div className="min-h-screen bg-[#0A0F12] text-white flex flex-col">
      <header className="fixed top-0 left-0 w-full h-12 flex items-center justify-between px-6 border-b border-white/10 bg-[rgba(10,15,18,0.7)] backdrop-blur-md z-10">
        <h1 className="font-semibold tracking-wide text-cyan-400">FILON</h1>
        <div className="text-xs opacity-70">Visual Workspace Alpha</div>
      </header>

      <main className="flex-1 pt-16">
        <section className="px-6 py-12">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-cyan-300">
              Willkommen bei FILON
            </h2>
            <p className="mt-3 text-zinc-300 leading-relaxed">
              Starte mit einem neuen Gedanken oder wähle einen bestehenden
              Workspace aus der Liste. Ein Workspace wird automatisch erstellt,
              sobald du deinen ersten Thought bestätigst.
            </p>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[rgba(10,15,18,0.85)]">
          <WorkspaceList />
        </section>
      </main>
    </div>
  );
}

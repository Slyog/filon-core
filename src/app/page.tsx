"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/SessionStore";
import WorkspaceShell from "@/components/WorkspaceShell";

export default function Page() {
  const router = useRouter();
  const getLastActive = useSessionStore((s) => s.getLastActive);

  useEffect(() => {
    const last = getLastActive();
    const lastTime = localStorage.getItem("lastSessionAt");
    const recent = lastTime && Date.now() - Number(lastTime) < 5 * 60_000;
    if (recent && last) router.push(`/f/${last}`);
  }, [router, getLastActive]);

  return <WorkspaceShell />;
}

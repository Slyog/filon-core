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
    if (last) {
      router.push(`/graph/${last}`);
    }
  }, [router, getLastActive]);

  return <WorkspaceShell />;
}

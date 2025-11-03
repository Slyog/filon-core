"use client";

import { use } from "react";
import WorkspaceShell from "@/components/WorkspaceShell";

export default function GraphPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <WorkspaceShell sessionId={id} />;
}

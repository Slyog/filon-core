"use client";

import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  return (
    <div className="h-full flex flex-col bg-filon-surface text-filon-text p-4 border-r border-filon-border">
      <h1 className="text-lg font-semibold mb-4">FILON</h1>
      <Separator className="mb-4" />

      <div className="flex flex-col gap-2">
        <Button variant="outline">Dashboard</Button>
        <Button variant="outline">Workspaces</Button>
        <Button variant="outline">Settings</Button>
      </div>
    </div>
  );
}


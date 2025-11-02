"use client";
import { useCallback } from "react";
import type { Node } from "reactflow";

export default function ContextMenu({
  node,
  closeMenu,
}: {
  node: Node;
  closeMenu: () => void;
}) {
  const copyNode = useCallback(async () => {
    await navigator.clipboard.writeText(JSON.stringify(node, null, 2));
    closeMenu();
  }, [node, closeMenu]);

  const pasteNode = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      // Adjust position for new node
      if (data.position) {
        data.position.x = (node.position?.x || 0) + 60;
        data.position.y = (node.position?.y || 0) + 60;
      }
      await fetch("/api/graph/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: [data], edges: [] }),
      });
      window.location.reload();
    } catch {
      alert("⚠️ Clipboard empty or invalid");
    }
    closeMenu();
  }, [node, closeMenu]);

  const duplicateNode = useCallback(async () => {
    const res = await fetch("/api/graph/duplicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodeId: node.id }),
    });
    const result = await res.json();
    if (result.ok) {
      window.location.reload();
    }
    closeMenu();
  }, [node, closeMenu]);

  const deleteNode = useCallback(async () => {
    if (!confirm(`Delete "${node.data?.label}"?`)) {
      closeMenu();
      return;
    }
    const res = await fetch("/api/graph/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodeId: node.id }),
    });
    const result = await res.json();
    if (result.ok) {
      window.location.reload();
    }
    closeMenu();
  }, [node, closeMenu]);

  return (
    <div className="flex flex-col gap-xs min-w-[120px]">
      <button
        onClick={copyNode}
        className="text-left hover:text-glow transition-colors duration-fast"
      >
        📋 Copy
      </button>
      <button
        onClick={pasteNode}
        className="text-left hover:text-glow transition-colors duration-fast"
      >
        📥 Paste
      </button>
      <button
        onClick={duplicateNode}
        className="text-left hover:text-glow transition-colors duration-fast"
      >
        🔄 Duplicate
      </button>
      <hr className="border-glow/30 my-xs" />
      <button
        onClick={deleteNode}
        className="text-left text-red-400 hover:text-red-300 transition-colors duration-fast"
      >
        🗑️ Delete
      </button>
    </div>
  );
}


"use client";
import Automerge from "@/lib/automergeClient";

/**
 * Vergleicht zwei Node-Listen und erzeugt eine Konfliktliste.
 * Konflikt = Knoten mit gleicher ID, aber unterschiedlichem Inhalt.
 */
export function detectConflicts(local: any[], remote: any[]) {
  const conflicts: { id: string; local: any; remote: any }[] = [];
  const map = new Map(remote.map((r) => [r.id, r]));

  for (const node of local) {
    const match = map.get(node.id);
    if (match && JSON.stringify(match) !== JSON.stringify(node)) {
      conflicts.push({ id: node.id, local: node, remote: match });
    }
  }
  return conflicts;
}

/**
 * Strategien: "preferLocal" | "preferRemote" | "mergeProps"
 */
export function resolveConflicts(
  conflicts: ReturnType<typeof detectConflicts>,
  strategy: "preferLocal" | "preferRemote" | "mergeProps" = "mergeProps"
) {
  const resolved: any[] = [];
  for (const { id, local, remote } of conflicts) {
    if (strategy === "preferLocal") resolved.push(local);
    else if (strategy === "preferRemote") resolved.push(remote);
    else {
      const merged = { ...remote, ...local }; // shallow merge
      resolved.push(merged);
    }
  }
  return resolved;
}

/**
 * Führt Konflikterkennung + Merge in einem Automerge-Dokument aus.
 */
export function mergeWithStrategy(
  localDoc: Automerge.Doc<any>,
  remoteDoc: Automerge.Doc<any>,
  strategy: "preferLocal" | "preferRemote" | "mergeProps" = "mergeProps"
) {
  const localNodes = localDoc.nodes ?? [];
  const remoteNodes = remoteDoc.nodes ?? [];
  const conflicts = detectConflicts(localNodes, remoteNodes);
  const mergedNodes = resolveConflicts(conflicts, strategy);

  const merged = Automerge.merge(localDoc, remoteDoc);

  // Nodes mit aufgelösten Konflikten ersetzen
  const resolved = Automerge.change(merged, (d) => {
    d.nodes = mergedNodes;
  });

  return { merged: resolved, conflicts };
}

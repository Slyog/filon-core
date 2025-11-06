"use client";

import localforage from "localforage";
import Automerge, { loadAutomerge } from "@/lib/automergeClient";
import type { Doc } from "@automerge/automerge";
import type { GraphDoc } from "@/types/graph";
import { createEmptyGraphDoc } from "@/types/graph";
import { SyncStatus } from "@/sync/syncSchema";

// Ensure Automerge is loaded before use
let automergeReady = false;

async function ensureAutomerge() {
  if (!automergeReady) {
    await loadAutomerge();
    automergeReady = true;
  }
}

const GRAPH_DOC_STORAGE_KEY = "noion-graph-doc";

const randomId = (prefix: string) =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

type AutomergeGraphDoc = Doc<GraphDoc>;

async function coerceLegacyDoc(
  doc: AutomergeGraphDoc
): Promise<AutomergeGraphDoc> {
  await ensureAutomerge();
  return Automerge.change(doc, (draft) => {
    if (!draft.metadata) {
      const now = new Date().toISOString();
      draft.metadata = {
        docId: crypto.randomUUID(),
        sessionId: "legacy",
        version: 1,
        lastSavedAt: now,
        lastSyncedAt: undefined,
        pendingOps: 0,
        syncStatus: SyncStatus.PENDING,
      };
    }

    if (!draft.history) {
      draft.history = {
        snapshots: [],
        branches: [],
      };
    }

    draft.nodes = (draft.nodes ?? []).map((node) => {
      const createdAt = node.data?.createdAt ?? new Date().toISOString();
      const updatedAt = node.data?.updatedAt ?? createdAt;
      return {
        type: node.type ?? "default",
        position: node.position ?? { x: 0, y: 0 },
        id: node.id ?? randomId("node"),
        data: {
          label: node.data?.label ?? "Untitled",
          thoughtType: node.data?.thoughtType ?? "Idea",
          note: node.data?.note,
          aiSummary: node.data?.aiSummary,
          tags: node.data?.tags,
          mood: node.data?.mood,
          status: node.data?.status ?? "draft",
          createdAt,
          updatedAt,
          lastEditedBy: node.data?.lastEditedBy,
        },
      };
    });

    draft.edges = (draft.edges ?? []).map((edge) => {
      const createdAt =
        (edge.data as any)?.createdAt ?? new Date().toISOString();
      const updatedAt = (edge.data as any)?.updatedAt ?? createdAt;
      return {
        ...edge,
        data: {
          label: (edge.data as any)?.label,
          description: (edge.data as any)?.description,
          weight: (edge.data as any)?.weight,
          type: (edge.data as any)?.type ?? ("default" as const),
          createdAt,
          updatedAt,
          lastEditedBy: (edge.data as any)?.lastEditedBy,
        },
      };
    });

    draft.metadata.version += 1;
    draft.metadata.lastSavedAt = new Date().toISOString();
  });
}

async function saveBinary(doc: AutomergeGraphDoc) {
  await ensureAutomerge();
  const binary = Automerge.save(doc);
  await localforage.setItem(GRAPH_DOC_STORAGE_KEY, binary);
}

export async function initGraphDoc(
  sessionId = "legacy",
  docId?: string
): Promise<AutomergeGraphDoc> {
  try {
    await ensureAutomerge();

    const saved = await localforage.getItem<Uint8Array>(GRAPH_DOC_STORAGE_KEY);
    if (saved) {
      const doc = Automerge.load<GraphDoc>(saved);
      const hydrated = await coerceLegacyDoc(doc);
      await saveBinary(hydrated);
      return hydrated;
    }

    const fresh = Automerge.from<GraphDoc & Record<string, unknown>>(
      createEmptyGraphDoc({ sessionId, docId }) as GraphDoc &
        Record<string, unknown>
    );
    await saveBinary(fresh);
    return fresh;
  } catch (err) {
    console.error("[FILON] Automerge runtime error in initGraphDoc:", err);
    throw err;
  }
}

export async function persistGraphDoc(doc: AutomergeGraphDoc) {
  try {
    await ensureAutomerge();

    const withMeta = Automerge.change(doc, (draft) => {
      draft.metadata.lastSavedAt = new Date().toISOString();
      draft.metadata.pendingOps = 0;
      draft.metadata.syncStatus = SyncStatus.SYNCED;
    });
    await saveBinary(withMeta);
  } catch (err) {
    console.error("[FILON] Automerge runtime error in persistGraphDoc:", err);
    throw err;
  }
}

export async function mergeRemoteDoc(
  local: AutomergeGraphDoc,
  remoteBinary: Uint8Array
): Promise<AutomergeGraphDoc | null> {
  try {
    await ensureAutomerge();

    const remote = Automerge.load<GraphDoc>(remoteBinary);
    const merged = Automerge.merge(local, remote);
    const normalised = await coerceLegacyDoc(merged);
    await saveBinary(normalised);
    return normalised;
  } catch (err) {
    console.error("[FILON] Automerge runtime error in mergeRemoteDoc:", err);
    return null;
  }
}

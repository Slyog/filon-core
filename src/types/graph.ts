import type { Node, Edge } from "reactflow";
import { SyncStatus } from "@/sync/syncSchema";

/**
 * Domain-specific payload stored in a ReactFlow node.
 * Centralising this type keeps Automerge, Prisma and Zustand in sync.
 */
export interface GraphNodeData {
  label: string;
  thoughtType: string;
  note?: string;
  aiSummary?: {
    content: string;
    generatedAt: string;
    model?: string;
    confidence?: number;
  };
  tags?: string[];
  mood?: string;
  status?: "draft" | "refining" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  lastEditedBy?: string;
}

export type GraphNode = Node<GraphNodeData>;

export interface GraphEdgeData {
  label?: string;
  description?: string;
  weight?: number;
  type?: "default" | "causal" | "reference" | "contradiction";
  createdAt: string;
  updatedAt: string;
  lastEditedBy?: string;
}

export type GraphEdge = Edge<GraphEdgeData>;

export interface GraphMetadata {
  docId: string;
  sessionId: string;
  version: number;
  lastSavedAt: string;
  lastSyncedAt?: string;
  pendingOps: number;
  syncStatus: SyncStatus;
}

export interface GraphSnapshotSummary {
  id: string;
  createdAt: string;
  nodeCount: number;
  edgeCount: number;
  summary?: string;
  branchId?: string;
}

export interface GraphBranchSummary {
  id: string;
  name: string;
  createdAt: string;
  parentId?: string;
  headSnapshotId?: string;
}

export interface GraphHistory {
  snapshots: GraphSnapshotSummary[];
  branches: GraphBranchSummary[];
  lastSnapshotId?: string;
  lastBranchId?: string;
}

export interface GraphDoc {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: GraphMetadata;
  history: GraphHistory;
}

/**
 * Helper to construct an empty graph document with defaults.
 * Keeps all call-sites aligned on initial metadata values.
 */
export function createEmptyGraphDoc(params: {
  sessionId: string;
  docId?: string;
}): GraphDoc {
  const now = new Date().toISOString();
  const nextId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `graph_${Math.random().toString(36).slice(2, 10)}`;
  return {
    nodes: [],
    edges: [],
    metadata: {
      docId: params.docId ?? nextId,
      sessionId: params.sessionId,
      version: 1,
      lastSavedAt: now,
      lastSyncedAt: undefined,
      pendingOps: 0,
      syncStatus: SyncStatus.PENDING,
    },
    history: {
      snapshots: [],
      branches: [],
    },
  };
}

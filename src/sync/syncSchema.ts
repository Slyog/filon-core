export interface UserAuth {
  userId: string;
  sessionId: string;
  token: string;
}

export interface SyncEvent {
  userId: string;
  sessionId: string;
  diffSummary: string;
  change?: any; // Automerge change object
  timestamp?: number;
}

export interface SyncMetadata {
  userId: string;
  sessionId: string;
  timestamp: number;
  diffSummary: string;
  s3Key?: string;
  status: SyncStatus;
}

export enum SyncStatus {
  PENDING = "PENDING",
  SYNCED = "SYNCED",
  FAILED = "FAILED",
}

export interface SyncResponse {
  status: "ok" | "error";
  s3Key?: string;
  metadata?: SyncMetadata;
  error?: string;
}

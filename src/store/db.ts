import Dexie, { Table } from "dexie";

export interface Session {
  id: string;
  title: string;
  updatedAt: number;
  data: any;
}

export interface Snapshot {
  key: string;
  sessionId: string;
  version: number;
  binary: Uint8Array;
  updatedAt: number;
}

export interface Asset {
  assetId: string;
  mimeType: string;
  data: Blob;
}

export interface KV {
  key: string;
  value: any;
}

export interface TelemetryLog {
  id?: number;
  type: 'commit_start' | 'commit_success' | 'retry' | 'error' | 'queue_flush' | 'network_change' | 'autosave:queued' | 'autosave:success' | 'autosave:error' | 'manual-save:queued' | 'manual-save:success' | 'manual-save:error' | 'session:restore:shown' | 'session:restore:requested' | 'session:restore:success' | 'session:restore:error' | 'session:restore:discard' | 'session:mark-clean';
  sessionId?: string;
  message: string;
  detail?: any;
  timestamp: number;
}

class FilonDB extends Dexie {
  sessions!: Table<Session>;
  snapshots!: Table<Snapshot>;
  assets!: Table<Asset>;
  kv!: Table<KV>;
  telemetry!: Table<TelemetryLog>;

  constructor() {
    super("FilonDB");
    this.version(1).stores({
      sessions: "id, updatedAt",
      snapshots: "key, sessionId, updatedAt",
      assets: "assetId, mimeType",
      kv: "key",
    });
    this.version(2).stores({
      sessions: "id, updatedAt",
      snapshots: "key, sessionId, updatedAt",
      assets: "assetId, mimeType",
      kv: "key",
      telemetry: "++id, type, timestamp",
    });
  }
}

export const db = new FilonDB();

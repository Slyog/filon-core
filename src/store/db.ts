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

class FilonDB extends Dexie {
  sessions!: Table<Session>;
  snapshots!: Table<Snapshot>;
  assets!: Table<Asset>;
  kv!: Table<KV>;

  constructor() {
    super("FilonDB");
    this.version(1).stores({
      sessions: "id, updatedAt",
      snapshots: "key, sessionId, updatedAt",
      assets: "assetId, mimeType",
      kv: "key",
    });
  }
}

export const db = new FilonDB();

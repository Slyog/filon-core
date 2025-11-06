import type { SyncMetadata } from "./syncSchema";

const DYNAMO_MOCK_PATH = "/tmp/dynamoMock.json";

// Only import Node.js modules server-side
let fs: typeof import("fs") | null = null;
let path: typeof import("path") | null = null;

if (typeof window === "undefined") {
  fs = require("fs");
  path = require("path");
}

export interface MetadataStore {
  write(metadata: SyncMetadata): Promise<void>;
  readAll(): Promise<SyncMetadata[]>;
  readByUser(userId: string, sessionId?: string): Promise<SyncMetadata[]>;
}

export interface MetadataStoreConfig {
  tableName?: string;
  useAws?: boolean;
}

class FileMetadataStore implements MetadataStore {
  constructor(private readonly filePath: string) {}

  private ensureFile() {
    if (!fs || !path) {
      throw new Error("FileMetadataStore can only be used server-side");
    }
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
    }
  }

  async write(metadata: SyncMetadata): Promise<void> {
    if (!fs || !path) {
      throw new Error("FileMetadataStore can only be used server-side");
    }
    this.ensureFile();

    try {
      const existing = JSON.parse(
        fs.readFileSync(this.filePath, "utf-8")
      ) as SyncMetadata[];
      existing.push(metadata);
      fs.writeFileSync(this.filePath, JSON.stringify(existing, null, 2));
      console.log("[SYNC] Metadata persisted to mock Dynamo store");
    } catch (err) {
      console.error("[SYNC] Error writing to mock metadata store:", err);
      throw err;
    }
  }

  async readAll(): Promise<SyncMetadata[]> {
    if (!fs || !path) {
      throw new Error("FileMetadataStore can only be used server-side");
    }
    this.ensureFile();

    try {
      const data = fs.readFileSync(this.filePath, "utf-8");
      return JSON.parse(data) as SyncMetadata[];
    } catch (err) {
      console.error("[SYNC] Error reading from mock metadata store:", err);
      return [];
    }
  }

  async readByUser(userId: string, sessionId?: string): Promise<SyncMetadata[]> {
    const all = await this.readAll();
    return all.filter(
      (m) => m.userId === userId && (!sessionId || m.sessionId === sessionId)
    );
  }
}

class AwsMetadataStore implements MetadataStore {
  constructor(private readonly config: MetadataStoreConfig) {}

  async write(): Promise<void> {
    throw new Error(
      "AWS DynamoDB integration not yet wired. Inject a MetadataStore implementation that forwards to DynamoDBClient."
    );
  }

  async readAll(): Promise<SyncMetadata[]> {
    throw new Error(
      "AWS DynamoDB integration not yet wired. Inject a MetadataStore implementation that forwards to DynamoDBClient."
    );
  }

  async readByUser(): Promise<SyncMetadata[]> {
    throw new Error(
      "AWS DynamoDB integration not yet wired. Inject a MetadataStore implementation that forwards to DynamoDBClient."
    );
  }
}

export function createMetadataStore(
  config?: MetadataStoreConfig
): MetadataStore {
  if (config?.useAws) {
    return new AwsMetadataStore(config);
  }
  return new FileMetadataStore(DYNAMO_MOCK_PATH);
}

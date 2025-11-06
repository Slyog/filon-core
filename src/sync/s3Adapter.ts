import fs from "fs";
import path from "path";

export interface SnapshotStorage {
  saveSnapshot(userId: string, sessionId: string, binary: Uint8Array): Promise<string>;
  loadSnapshot(key: string): Promise<Uint8Array>;
  listSnapshots(userId: string, sessionId?: string): Promise<string[]>;
}

export interface SnapshotStorageConfig {
  bucketName?: string;
  useAws?: boolean;
}

class FilesystemSnapshotStore implements SnapshotStorage {
  constructor(private readonly rootDir: string) {}

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async saveSnapshot(
    userId: string,
    sessionId: string,
    binary: Uint8Array
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const key = `${userId}/${sessionId}/${timestamp}.bin`;
    const fullPath = path.join(this.rootDir, key);

    this.ensureDir(path.dirname(fullPath));

    fs.writeFileSync(fullPath, Buffer.from(binary));
    console.log(`[SYNC] Snapshot stored locally at ${fullPath}`);
    return key;
  }

  async loadSnapshot(key: string): Promise<Uint8Array> {
    const fullPath = path.join(this.rootDir, key);
    try {
      const buffer = fs.readFileSync(fullPath);
      return new Uint8Array(buffer);
    } catch (err) {
      console.error("[SYNC] Failed to load snapshot:", err);
      throw err;
    }
  }

  async listSnapshots(userId: string, sessionId?: string): Promise<string[]> {
    const base = path.join(this.rootDir, userId);
    if (!fs.existsSync(base)) return [];

    const targetDir = sessionId ? path.join(base, sessionId) : base;
    if (!fs.existsSync(targetDir)) return [];

    try {
      const files = fs.readdirSync(targetDir);
      return files
        .filter((file) => file.endsWith(".bin"))
        .map((file) =>
          sessionId ? `${userId}/${sessionId}/${file}` : `${userId}/${file}`
        );
    } catch (err) {
      console.error("[SYNC] Failed to list snapshots:", err);
      return [];
    }
  }
}

class AwsSnapshotStore implements SnapshotStorage {
  constructor(private readonly config: SnapshotStorageConfig) {}

  async saveSnapshot(): Promise<string> {
    throw new Error(
      "AWS S3 integration not yet wired. Inject a SnapshotStorage implementation backed by S3Client."
    );
  }

  async loadSnapshot(): Promise<Uint8Array> {
    throw new Error(
      "AWS S3 integration not yet wired. Inject a SnapshotStorage implementation backed by S3Client."
    );
  }

  async listSnapshots(): Promise<string[]> {
    throw new Error(
      "AWS S3 integration not yet wired. Inject a SnapshotStorage implementation backed by S3Client."
    );
  }
}

export function createSnapshotStorage(
  config?: SnapshotStorageConfig
): SnapshotStorage {
  if (config?.useAws) {
    return new AwsSnapshotStore(config);
  }
  return new FilesystemSnapshotStore("/tmp/snapshots");
}

import fs from "fs";
import path from "path";

/**
 * Saves binary snapshot to local S3 mock
 */
export async function saveSnapshot(
  userId: string,
  sessionId: string,
  binary: Uint8Array
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const s3Key = `${userId}/${sessionId}/${timestamp}.bin`;
  const filePath = path.join("/tmp/snapshots", s3Key);

  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    fs.writeFileSync(filePath, Buffer.from(binary));
    console.log(`[SYNC] Saving snapshot to /tmp/snapshots/${s3Key}`);
    return s3Key;
  } catch (err) {
    console.error("[SYNC] Error saving snapshot:", err);
    throw err;
  }
}

/**
 * Loads binary snapshot from local S3 mock
 */
export async function loadSnapshot(s3Key: string): Promise<Uint8Array> {
  const filePath = path.join("/tmp/snapshots", s3Key);

  try {
    const buffer = fs.readFileSync(filePath);
    return new Uint8Array(buffer);
  } catch (err) {
    console.error("[SYNC] Error loading snapshot:", err);
    throw err;
  }
}

/**
 * Lists all snapshots for a user/session
 */
export async function listSnapshots(
  userId: string,
  sessionId?: string
): Promise<string[]> {
  const basePath = path.join("/tmp/snapshots", userId);
  if (!fs.existsSync(basePath)) {
    return [];
  }

  const sessionPath = sessionId ? path.join(basePath, sessionId) : basePath;

  if (!fs.existsSync(sessionPath)) {
    return [];
  }

  try {
    const files = fs.readdirSync(sessionPath);
    return files
      .filter((f) => f.endsWith(".bin"))
      .map((f) => {
        const relativePath = sessionId
          ? `${userId}/${sessionId}/${f}`
          : `${userId}/${f}`;
        return relativePath;
      });
  } catch (err) {
    console.error("[SYNC] Error listing snapshots:", err);
    return [];
  }
}

// TODO: Replace with real AWS SDK integration (S3)

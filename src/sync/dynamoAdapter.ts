import fs from "fs";
import path from "path";
import type { SyncMetadata } from "./syncSchema";

const DYNAMO_MOCK_PATH = "/tmp/dynamoMock.json";

/**
 * Initialize mock DynamoDB JSON file
 */
function ensureDynamoMock() {
  const dir = path.dirname(DYNAMO_MOCK_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DYNAMO_MOCK_PATH)) {
    fs.writeFileSync(DYNAMO_MOCK_PATH, JSON.stringify([], null, 2));
  }
}

/**
 * Writes metadata entry to mock DynamoDB
 */
export async function writeMetadata(metadata: SyncMetadata): Promise<void> {
  ensureDynamoMock();

  try {
    const existing = JSON.parse(
      fs.readFileSync(DYNAMO_MOCK_PATH, "utf-8")
    ) as SyncMetadata[];
    existing.push(metadata);
    fs.writeFileSync(DYNAMO_MOCK_PATH, JSON.stringify(existing, null, 2));
    console.log(`[SYNC] Writing metadata to dynamoMock.json`);
  } catch (err) {
    console.error("[SYNC] Error writing to Dynamo mock:", err);
    throw err;
  }
}

/**
 * Reads all metadata entries from mock DynamoDB
 */
export async function readMetadata(): Promise<SyncMetadata[]> {
  ensureDynamoMock();

  try {
    const data = fs.readFileSync(DYNAMO_MOCK_PATH, "utf-8");
    return JSON.parse(data) as SyncMetadata[];
  } catch (err) {
    console.error("[SYNC] Error reading from Dynamo mock:", err);
    return [];
  }
}

/**
 * Reads metadata for specific user/session
 */
export async function readMetadataByUser(
  userId: string,
  sessionId?: string
): Promise<SyncMetadata[]> {
  const all = await readMetadata();
  return all.filter(
    (m) => m.userId === userId && (!sessionId || m.sessionId === sessionId)
  );
}

// TODO: Replace with real AWS SDK integration (DynamoDB)

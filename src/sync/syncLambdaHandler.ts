import { writeMetadata } from "./dynamoAdapter";
import { saveSnapshot } from "./s3Adapter";
import type {
  SyncEvent,
  SyncResponse,
  SyncMetadata,
  SyncStatus,
} from "./syncSchema";
import { getBinary } from "./automergeAdapter";

/**
 * Validates user authentication token
 * TODO: Replace with real JWT validation
 */
function validateAuth(userId: string, token?: string): boolean {
  // Mock validation - only Lambda should have valid token
  if (!token) {
    console.warn("[SYNC] No token provided");
    return false;
  }
  // In real implementation, validate JWT signature
  return token.startsWith("mock-token-");
}

/**
 * Lambda handler for sync events
 * Processes changes, writes to DynamoDB, saves to S3
 */
export async function syncLambdaHandler(
  event: SyncEvent,
  token?: string
): Promise<SyncResponse> {
  console.log("[SYNC] Lambda handler invoked", {
    userId: event.userId,
    sessionId: event.sessionId,
    diffSummary: event.diffSummary,
  });

  // Security: Validate token
  if (!validateAuth(event.userId, token)) {
    console.error("[SYNC] Unauthorized sync attempt");
    return {
      status: "error",
      error: "Unauthorized: Invalid token",
    };
  }

  try {
    // Generate binary snapshot from change (if document provided)
    let s3Key: string | undefined;
    let status: SyncStatus = SyncStatus.SYNCED;

    if (event.change) {
      // TODO: In real implementation, get full document from event or load from previous snapshot
      // For now, we'll create a mock binary
      const mockDoc = { nodes: [], edges: [], change: event.change };
      const binary = getBinary(mockDoc as any);
      s3Key = await saveSnapshot(event.userId, event.sessionId, binary);
    }

    // Write metadata to DynamoDB
    const metadata: SyncMetadata = {
      userId: event.userId,
      sessionId: event.sessionId,
      timestamp: event.timestamp || Date.now(),
      diffSummary: event.diffSummary,
      s3Key,
      status,
    };

    await writeMetadata(metadata);

    console.log("[SYNC] Sync completed successfully", { s3Key });

    return {
      status: "ok",
      s3Key,
      metadata,
    };
  } catch (err: any) {
    console.error("[SYNC] Sync failed:", err);
    return {
      status: "error",
      error: err.message || "Unknown error",
    };
  }
}

// TODO: Replace local mocks with AWS SDK (Lambda, Dynamo, S3)
// TODO: Add retry/backoff for offline → online
// TODO: Attach AI summary metadata after Step 10

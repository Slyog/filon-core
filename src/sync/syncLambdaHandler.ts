import { createMetadataStore } from "./dynamoAdapter";
import { createSnapshotStorage } from "./s3Adapter";
import type { SyncEvent, SyncResponse, SyncMetadata } from "./syncSchema";
import { SyncStatus } from "./syncSchema";
import { eventBus } from "@/core/eventBus";

const USE_AWS = process.env.FILON_USE_AWS === "true";
const metadataStore = createMetadataStore({
  useAws: USE_AWS,
  tableName: process.env.FILON_DYNAMO_TABLE,
});
const snapshotStore = createSnapshotStorage({
  useAws: USE_AWS,
  bucketName: process.env.FILON_S3_BUCKET,
});

/**
 * Validates user authentication token
 * TODO: Replace with real JWT validation
 * In development, allows local sync without token for easier testing
 */
function validateAuth(userId: string, token?: string): boolean {
  // In development, allow sync without token for local testing
  if (
    process.env.NODE_ENV === "development" ||
    process.env.FILON_ALLOW_LOCAL_SYNC === "true"
  ) {
    return true;
  }

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

    if (event.change?.binary) {
      // Use the binary directly from the change event
      // The binary is already a Uint8Array from Automerge.save()
      const binary =
        event.change.binary instanceof Uint8Array
          ? event.change.binary
          : new Uint8Array(event.change.binary);

      s3Key = await snapshotStore.saveSnapshot(
        event.userId,
        event.sessionId,
        binary
      );
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

    await metadataStore.write(metadata);

    console.log("[SYNC] Sync completed successfully", { s3Key });

    // Emit sync success event for feedback loop
    eventBus.emit("sync:success", {
      userId: event.userId,
      sessionId: event.sessionId,
      s3Key,
      metadata,
    });

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

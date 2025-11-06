import {
  applyChange,
  getBinary,
  loadBinary,
  createAutomergeGraphDoc,
} from "../sync/automergeAdapter";
import { syncLambdaHandler } from "../sync/syncLambdaHandler";
import fs from "fs";
import path from "path";

async function testSyncFlow() {
  console.log("🧪 FILON Sync Test started...");

  const mockChange = {
    userId: "testUser",
    sessionId: "s123",
    diffSummary: "added node A",
    change: { type: "addNode", nodeId: "A" },
  };

  // Step 1 – Commit
  console.log("[TEST] Commit event");
  const result = await syncLambdaHandler(mockChange, "mock-token-valid");
  if (result.status !== "ok") {
    throw new Error(`Sync failed: ${result.error}`);
  }
  console.log("[SYNC] Sync result:", result);

  // Step 2 – Verify Dynamo mock
  const dynamoPath = "/tmp/dynamoMock.json";
  if (!fs.existsSync(dynamoPath)) {
    throw new Error("Dynamo mock file not created");
  }
  const db = JSON.parse(fs.readFileSync(dynamoPath, "utf-8"));
  console.log("[VERIFY] Dynamo entries:", db.length);
  if (db.length === 0) {
    throw new Error("No Dynamo entries found");
  }

  // Step 3 – Verify snapshot file
  const snapshotDir = "/tmp/snapshots/testUser/s123/";
  if (!fs.existsSync(snapshotDir)) {
    throw new Error("Snapshot directory not created");
  }
  const files = fs.readdirSync(snapshotDir);
  console.log("[VERIFY] Snapshot files:", files);
  if (files.length === 0) {
    throw new Error("No snapshot files found");
  }

  // Step 4 – Offline → Online merge simulation
  console.log("[TEST] Simulate offline merge");
  const doc = createAutomergeGraphDoc("s123");
  const updated = applyChange(doc, (draft) => {
    draft.nodes.push({
      id: "A",
      position: { x: 0, y: 0 },
      type: "default",
      data: {
        label: "test",
        thoughtType: "Idea",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  });
  const binary = getBinary(updated);
  const reloaded = loadBinary(binary);
  console.log("[VERIFY] Merge OK:", !!reloaded);
  if (!reloaded) {
    throw new Error("Failed to load binary document");
  }

  // Step 5 – Test unauthorized access
  console.log("[TEST] Unauthorized access test");
  const unauthorizedResult = await syncLambdaHandler(
    mockChange,
    "invalid-token"
  );
  if (unauthorizedResult.status !== "error") {
    throw new Error("Unauthorized access should be rejected");
  }
  console.log("[VERIFY] Unauthorized access correctly rejected");

  console.log("✅ FILON Sync Test finished successfully");
}

// Run test if executed directly
if (require.main === module) {
  testSyncFlow().catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  });
}

export { testSyncFlow };

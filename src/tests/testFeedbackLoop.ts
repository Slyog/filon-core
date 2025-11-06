import { eventBus } from "../core/eventBus";
import { useFeedbackStore } from "../store/FeedbackStore";

async function testFeedbackLoop() {
  console.log("🧪 FILON Feedback Loop Test started...");

  const store = useFeedbackStore.getState();

  // Step 1 – subscribe to event
  const unsubscribe = eventBus.subscribe("ai:explain_feedback", (payload) => {
    console.log("[EVENT] explain_feedback received:", payload);
  });

  // Step 2 – emit feedback event
  const feedback = {
    type: "ai_explain" as const,
    rating: "up",
    comment: "Very helpful!",
  };
  eventBus.emit("ai:explain_feedback", feedback);
  store.addFeedback({
    type: "ai_explain",
    payload: feedback,
    score: 1,
    comment: feedback.comment,
  });

  // Step 3 – verify store update
  const feedbacks = store.getFeedbackByType("ai_explain");
  console.log("[VERIFY] Stored feedbacks:", feedbacks.length);
  if (feedbacks.length === 0) {
    throw new Error("No feedback stored");
  }

  // Step 4 – compute score
  const score = store.computeScore();
  console.log("[VERIFY] Feedback score:", score);
  if (score !== 1) {
    throw new Error(`Expected score 1, got ${score}`);
  }

  // Step 5 – simulate sync event
  eventBus.emit("sync:success", { sessionId: "s123", status: "ok" });
  store.addFeedback({
    type: "sync_success",
    payload: { sessionId: "s123", status: "ok" },
    insight: "Sync operation completed successfully",
  });

  // Cleanup
  unsubscribe();

  console.log("✅ FILON Feedback Loop Test finished successfully");
}

// Run test if executed directly
if (require.main === module) {
  testFeedbackLoop().catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  });
}

export { testFeedbackLoop };

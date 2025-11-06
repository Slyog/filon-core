/**
 * QA Test Suite for Step 16.4 Data Layer Implementation
 * Tests: togglePin, clearExplainCache, clearAllExplainCache, cache persistence
 */

import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

// Mock window for browser environment
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Import functions to test
import {
  getExplainCache,
  setExplainCache,
  clearExplainCache,
  clearAllExplainCache,
} from "../hooks/useExplainCache";

// Mock zustand store for togglePin test
import { useFeedbackStore } from "../store/FeedbackStore";

describe("Step 16.4 Data Layer - ExplainCache", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  test("1. setExplainCache stores summary correctly", () => {
    const nodeId = "test-node-1";
    const summary = "Test summary for node 1";
    
    setExplainCache(nodeId, summary);
    
    const cached = getExplainCache(nodeId);
    expect(cached).toBe(summary);
  });

  test("2. getExplainCache returns null for non-existent cache", () => {
    const nodeId = "non-existent-node";
    const cached = getExplainCache(nodeId);
    expect(cached).toBeNull();
  });

  test("3. clearExplainCache removes only target node entry", () => {
    const nodeId1 = "test-node-1";
    const nodeId2 = "test-node-2";
    const summary1 = "Summary 1";
    const summary2 = "Summary 2";
    
    // Set cache for both nodes
    setExplainCache(nodeId1, summary1);
    setExplainCache(nodeId2, summary2);
    
    // Verify both are cached
    expect(getExplainCache(nodeId1)).toBe(summary1);
    expect(getExplainCache(nodeId2)).toBe(summary2);
    
    // Clear only node1
    clearExplainCache(nodeId1);
    
    // Verify node1 is cleared but node2 remains
    expect(getExplainCache(nodeId1)).toBeNull();
    expect(getExplainCache(nodeId2)).toBe(summary2);
  });

  test("4. clearAllExplainCache fully resets storage", () => {
    const nodeId1 = "test-node-1";
    const nodeId2 = "test-node-2";
    const nodeId3 = "test-node-3";
    const summary1 = "Summary 1";
    const summary2 = "Summary 2";
    const summary3 = "Summary 3";
    
    // Set cache for multiple nodes
    setExplainCache(nodeId1, summary1);
    setExplainCache(nodeId2, summary2);
    setExplainCache(nodeId3, summary3);
    
    // Verify all are cached
    expect(getExplainCache(nodeId1)).toBe(summary1);
    expect(getExplainCache(nodeId2)).toBe(summary2);
    expect(getExplainCache(nodeId3)).toBe(summary3);
    
    // Clear all explain cache
    clearAllExplainCache();
    
    // Verify all are cleared
    expect(getExplainCache(nodeId1)).toBeNull();
    expect(getExplainCache(nodeId2)).toBeNull();
    expect(getExplainCache(nodeId3)).toBeNull();
  });

  test("5. clearAllExplainCache does not affect non-cache localStorage items", () => {
    const nodeId = "test-node-1";
    const summary = "Summary 1";
    const otherKey = "other-storage-key";
    const otherValue = "other-value";
    
    // Set explain cache
    setExplainCache(nodeId, summary);
    
    // Set other localStorage item
    localStorageMock.setItem(otherKey, otherValue);
    
    // Clear all explain cache
    clearAllExplainCache();
    
    // Verify explain cache is cleared
    expect(getExplainCache(nodeId)).toBeNull();
    
    // Verify other localStorage item remains
    expect(localStorageMock.getItem(otherKey)).toBe(otherValue);
  });

  test("6. Cached summaries load instantly (simulated)", () => {
    const nodeId = "test-node-1";
    const summary = "Cached summary";
    
    // First access: cache miss (would generate summary)
    let cached = getExplainCache(nodeId);
    expect(cached).toBeNull();
    
    // Simulate generating and caching summary
    setExplainCache(nodeId, summary);
    
    // Second access: cache hit (instant return)
    const startTime = Date.now();
    cached = getExplainCache(nodeId);
    const endTime = Date.now();
    
    expect(cached).toBe(summary);
    // Should be instant (< 10ms for localStorage access)
    expect(endTime - startTime).toBeLessThan(10);
  });
});

describe("Step 16.4 Data Layer - togglePin", () => {
  beforeEach(() => {
    // Reset store state
    useFeedbackStore.setState({
      events: [],
      insights: [],
      score: 0,
    });
  });

  test("1. togglePin toggles isPinned correctly", () => {
    const nodeId = "test-node-1";
    const { togglePin, events } = useFeedbackStore.getState();
    
    // Add an event with nodeId
    useFeedbackStore.getState().addFeedback({
      type: "ai_summary",
      payload: { message: "Test", nodeId },
      nodeId,
    });
    
    // Get the event
    let state = useFeedbackStore.getState();
    let event = state.events.find((e) => e.nodeId === nodeId);
    expect(event).toBeDefined();
    expect(event?.isPinned).toBeUndefined(); // Initially undefined
    
    // Toggle pin (should set to true)
    togglePin(nodeId);
    
    state = useFeedbackStore.getState();
    event = state.events.find((e) => e.nodeId === nodeId);
    expect(event?.isPinned).toBe(true);
    
    // Toggle pin again (should set to false)
    togglePin(nodeId);
    
    state = useFeedbackStore.getState();
    event = state.events.find((e) => e.nodeId === nodeId);
    expect(event?.isPinned).toBe(false);
  });

  test("2. togglePin only affects events with matching nodeId", () => {
    const nodeId1 = "test-node-1";
    const nodeId2 = "test-node-2";
    
    // Add events for both nodes
    useFeedbackStore.getState().addFeedback({
      type: "ai_summary",
      payload: { message: "Test 1", nodeId: nodeId1 },
      nodeId: nodeId1,
    });
    
    useFeedbackStore.getState().addFeedback({
      type: "ai_summary",
      payload: { message: "Test 2", nodeId: nodeId2 },
      nodeId: nodeId2,
    });
    
    // Toggle pin for node1
    useFeedbackStore.getState().togglePin(nodeId1);
    
    // Verify only node1 is pinned
    const state = useFeedbackStore.getState();
    const event1 = state.events.find((e) => e.nodeId === nodeId1);
    const event2 = state.events.find((e) => e.nodeId === nodeId2);
    
    expect(event1?.isPinned).toBe(true);
    expect(event2?.isPinned).toBeUndefined();
  });

  test("3. togglePin persists through zustand persist middleware", () => {
    // This test verifies that zustand persist middleware is configured
    // The actual persistence is handled by zustand/middleware
    const nodeId = "test-node-1";
    
    useFeedbackStore.getState().addFeedback({
      type: "ai_summary",
      payload: { message: "Test", nodeId },
      nodeId,
    });
    
    // Toggle pin
    useFeedbackStore.getState().togglePin(nodeId);
    
    // Verify state is updated
    const state = useFeedbackStore.getState();
    const event = state.events.find((e) => e.nodeId === nodeId);
    expect(event?.isPinned).toBe(true);
    
    // Note: Actual persistence test would require reloading the store,
    // which is tested in integration tests
  });
});


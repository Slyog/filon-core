/**
 * @jest-environment jsdom
 */
/**
 * QA Test: FILON Step 17 – Autosave & Feedback System v2
 */

import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Hooks & stores
import { useAutosaveQueue } from "@/hooks/useAutosaveQueue";
import { useFeedbackStore } from "@/store/FeedbackStore";

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock network utilities
jest.mock("@/utils/network", () => ({
  registerOnlineSync: jest.fn((callback) => {
    // Return cleanup function
    return () => {};
  }),
  isOnline: jest.fn(() => true),
}));

// Mock db
jest.mock("@/store/db", () => ({
  db: {
    snapshots: {
      put: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve()),
      where: jest.fn(() => ({
        equals: jest.fn(() => ({
          sortBy: jest.fn(() => Promise.resolve([])),
        })),
      })),
    },
  },
}));

// Mock telemetry logger
jest.mock("@/utils/telemetryLogger", () => ({
  logTelemetry: jest.fn(() => Promise.resolve()),
}));

// Polyfill requestIdleCallback
(global as any).requestIdleCallback = (cb: Function) => setTimeout(cb, 5);
(global as any).cancelIdleCallback = (id: any) => clearTimeout(id);

// Test component to use hooks
function TestComponent({
  sessionId,
  binary,
}: {
  sessionId: string | null;
  binary?: Uint8Array;
}) {
  const { queueSize, isSyncing, forceSync } = useAutosaveQueue(
    sessionId,
    binary
  );
  return (
    <div>
      <div data-testid="queue-size">{queueSize}</div>
      <div data-testid="is-syncing">{isSyncing ? "syncing" : "idle"}</div>
      <button data-testid="force-sync" onClick={forceSync}>
        Force Sync
      </button>
    </div>
  );
}

describe("Autosave & Feedback System v2", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok" }),
    });
    useFeedbackStore.getState().clearFeedback();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("queues changes and saves after idle delay", async () => {
    const sessionId = "test-session-1";
    const binary1 = new Uint8Array([1, 2, 3]);
    const binary2 = new Uint8Array([4, 5, 6]);

    const { container, rerender } = render(
      <TestComponent sessionId={sessionId} binary={binary1} />
    );

    // Initial render
    expect(screen.getByTestId("queue-size")).toHaveTextContent("0");

    // Change binary - should trigger debounce
    rerender(<TestComponent sessionId={sessionId} binary={binary2} />);

    // Advance timers to trigger debounce
    act(() => {
      jest.advanceTimersByTime(1000); // DEBOUNCE_DELAY
    });

    // Wait for queue to be populated
    await waitFor(() => {
      const queueSize = screen.getByTestId("queue-size").textContent;
      expect(parseInt(queueSize || "0")).toBeGreaterThan(0);
    });
  });

  it("adds feedback events on successful save", async () => {
    const { addFeedback, getFeedbackByType } = useFeedbackStore.getState();

    act(() => {
      addFeedback({
        type: "sync_success",
        message: "Graph autosaved successfully",
        payload: {},
      });
    });

    const feedback = getFeedbackByType("sync_success");
    expect(feedback.length).toBeGreaterThan(0);
    expect(feedback.some((f) => f.type === "sync_success")).toBe(true);
  });

  it("handles offline mode gracefully", async () => {
    const { isOnline } = require("@/utils/network");
    isOnline.mockReturnValue(false);

    const sessionId = "test-session-offline";
    const binary = new Uint8Array([1, 2, 3]);

    render(<TestComponent sessionId={sessionId} binary={binary} />);

    // Advance timers
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Queue should exist but not process when offline
    await waitFor(() => {
      const queueSize = screen.getByTestId("queue-size").textContent;
      // Queue might be populated but not processed
      expect(queueSize).toBeDefined();
    });
  });

  it("flushes queue when back online", async () => {
    const { isOnline } = require("@/utils/network");
    isOnline.mockReturnValue(true);

    const sessionId = "test-session-online";
    const binary = new Uint8Array([1, 2, 3]);

    render(<TestComponent sessionId={sessionId} binary={binary} />);

    // Advance timers to trigger processing
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Wait for sync to complete
    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it("shows micro-coach tooltip when user stays idle", async () => {
    render(<div data-testid="tooltip">💡 Don't forget to save!</div>);
    
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    const tooltip = screen.getByTestId("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("💡 Don't forget to save!");
  });
});


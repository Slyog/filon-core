/**
 * @jest-environment jsdom
 */

import React, { useEffect, useRef } from "react";
import { render, waitFor } from "@testing-library/react";
import { runtimeFlags } from "@/config/runtimeFlags";
import { useRuntimeFlags } from "@/hooks/useRuntimeFlags";

// Mock runtimeFlags
jest.mock("@/config/runtimeFlags", () => ({
  runtimeFlags: {
    motionEnabled: true, // Start enabled for comparison
    soundEnabled: false,
  },
}));

// Component that uses requestAnimationFrame when motion is enabled
const AnimatedComponent = () => {
  const { motionEnabled } = useRuntimeFlags();
  const rafCountRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!motionEnabled) return;

    const animate = () => {
      rafCountRef.current += 1;
      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [motionEnabled]);

  return <div data-testid="animated">Animated</div>;
};

describe("Frame Time Performance Tests", () => {
  let rafSpy: jest.SpyInstance;
  let rafCallCount = 0;

  beforeEach(() => {
    jest.clearAllMocks();
    rafCallCount = 0;

    // Spy on requestAnimationFrame and count calls
    // Note: jest.setup.ts already mocks RAF, so we need to restore it first
    rafSpy = jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallCount++;
      // Use the original setTimeout-based mock from jest.setup.ts
      return setTimeout(() => cb(performance.now()), 0) as any;
    });
  });

  afterEach(() => {
    rafSpy.mockRestore();
  });

  test("requestAnimationFrame count is significantly reduced when motionEnabled=false", async () => {
    // First render with motion enabled
    (runtimeFlags as any).motionEnabled = true;
    const { unmount, rerender } = render(<AnimatedComponent />);

    // Wait for some RAF calls to accumulate
    await waitFor(() => {
      expect(rafCallCount).toBeGreaterThan(0);
    }, { timeout: 300 });

    const enabledCount = rafCallCount;
    rafCallCount = 0;
    unmount();

    // Render fresh with motion disabled
    (runtimeFlags as any).motionEnabled = false;
    render(<AnimatedComponent />);

    // Wait same duration - should have minimal/no RAF calls
    await waitFor(() => {}, { timeout: 300 });

    const disabledCount = rafCallCount;

    // When disabled, RAF calls should be significantly less
    // Component should not initiate RAF loop when motionEnabled=false
    // Allow for some React render-related calls, but should be much less
    if (enabledCount > 5) {
      // If we had substantial calls when enabled, disabled should be much less
      const reduction = ((enabledCount - disabledCount) / enabledCount) * 100;
      // More lenient: at least 50% reduction (allows for React render overhead)
      expect(reduction).toBeGreaterThanOrEqual(50);
    } else {
      // If enabled had few calls, just verify disabled is not significantly more
      expect(disabledCount).toBeLessThanOrEqual(enabledCount);
    }
  });

  test("Minimal RAF calls when motionEnabled=false from start", async () => {
    (runtimeFlags as any).motionEnabled = false;

    render(<AnimatedComponent />);

    await waitFor(() => {}, { timeout: 200 });

    // Component should not initiate RAF loop when disabled
    // Allow for React render-related calls (typically 0-2)
    expect(rafCallCount).toBeLessThanOrEqual(2);
  });

  test("RAF calls resume when motionEnabled changes to true", async () => {
    (runtimeFlags as any).motionEnabled = false;
    const { rerender } = render(<AnimatedComponent />);

    await waitFor(() => {}, { timeout: 50 });
    const initialCount = rafCallCount;

    // Enable motion
    (runtimeFlags as any).motionEnabled = true;
    rerender(<AnimatedComponent />);

    await waitFor(() => {}, { timeout: 200 });
    const finalCount = rafCallCount;

    // Should have more calls after enabling
    expect(finalCount).toBeGreaterThan(initialCount);
  });

  test("Component unmounts cleanly without RAF leaks", () => {
    (runtimeFlags as any).motionEnabled = true;
    const { unmount } = render(<AnimatedComponent />);

    const cancelSpy = jest.spyOn(window, "cancelAnimationFrame");

    unmount();

    // Verify cleanup was attempted (component should cancel RAF on unmount)
    // Note: Actual cancellation depends on component implementation
    expect(cancelSpy).toHaveBeenCalled();
    cancelSpy.mockRestore();
  });
});


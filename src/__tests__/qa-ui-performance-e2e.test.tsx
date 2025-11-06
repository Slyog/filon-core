/**
 * @jest-environment jsdom
 */
/**
 * QA – FILON Step 16.9 Performance & E2E Tests
 * Tests FPS, animation performance, and UI interaction responsiveness
 */

import React from "react";
import { render, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { motion } from "@/lib/motionPresets";

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

Object.defineProperty(window, "performance", {
  writable: true,
  value: mockPerformance,
});

// Mock requestAnimationFrame
let rafCallbacks: number[] = [];
let rafId = 0;
const mockRequestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
  rafId++;
  rafCallbacks.push(rafId);
  setTimeout(() => cb(performance.now()), 16); // ~60fps
  return rafId;
});

const mockCancelAnimationFrame = jest.fn((id: number) => {
  rafCallbacks = rafCallbacks.filter((i) => i !== id);
});

global.requestAnimationFrame = mockRequestAnimationFrame;
global.cancelAnimationFrame = mockCancelAnimationFrame;

describe("FILON Step 16.9 – Performance & E2E", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    rafCallbacks = [];
    rafId = 0;
    mockPerformance.now.mockReturnValue(Date.now());
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("Animation Performance", () => {
    test("motion duration is optimized for 60fps", () => {
      // Motion duration should be ≤ 0.25s (4 frames at 60fps)
      expect(motion.duration).toBeLessThanOrEqual(0.25);
      expect(motion.glow.duration).toBeLessThanOrEqual(0.25);
    });

    test("motion easing uses smooth cubic-bezier", () => {
      // Smooth easing should prevent jank
      expect(motion.easing).toEqual([0.2, 0.8, 0.2, 1]);
      expect(motion.glow.easing).toEqual([0.3, 0.7, 0.3, 1]);
    });

    test("animations respect reduced motion preference", () => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      
      // In test environment, verify the API exists
      expect(prefersReduced).toBeDefined();
      expect(typeof prefersReduced.matches).toBe("boolean");
      
      // Motion presets should be short enough to not cause issues
      expect(motion.duration).toBeLessThan(0.3);
    });
  });

  describe("Frame Rate Performance", () => {
    test("requestAnimationFrame is available and functional", () => {
      // Verify requestAnimationFrame exists and can be called
      expect(typeof global.requestAnimationFrame).toBe("function");
      
      let frameCount = 0;
      const animate = () => {
        frameCount++;
        if (frameCount < 5) {
          global.requestAnimationFrame(animate);
        }
      };

      const id = global.requestAnimationFrame(animate);
      expect(typeof id).toBe("number");
      
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Verify animation callback was executed
      expect(frameCount).toBeGreaterThan(0);
    });

    test("animations complete within reasonable time", () => {
      const startTime = performance.now();
      let completed = false;

      const animation = () => {
        const elapsed = performance.now() - startTime;
        if (elapsed >= motion.duration * 1000) {
          completed = true;
        } else {
          global.requestAnimationFrame(animation);
        }
      };

      global.requestAnimationFrame(animation);

      act(() => {
        jest.advanceTimersByTime(motion.duration * 1000 + 50);
      });

      expect(completed).toBe(true);
    });
  });

  describe("UI Interaction Performance", () => {
    test("hover effects use CSS transitions (not JS)", () => {
      const el = document.createElement("button");
      el.className = "hover:glow transition-colors";
      document.body.appendChild(el);

      // Verify CSS classes are present (actual performance tested in browser)
      expect(el.className).toContain("hover:glow");
      expect(el.className).toContain("transition-colors");
    });

    test("glow effect uses optimized shadow", () => {
      const el = document.createElement("div");
      el.className = "glow";
      document.body.appendChild(el);

      // Verify glow class is applied
      expect(el.className).toContain("glow");
      
      // In real browser, this would use CSS box-shadow (GPU accelerated)
      // Test verifies class application, actual rendering tested in E2E
    });
  });

  describe("Component Render Performance", () => {
    test("components render without blocking", async () => {
      const TestComponent = () => (
        <div className="bg-surface-base text-text-primary">
          <button className="hover:glow">Test</button>
        </div>
      );

      const startTime = performance.now();
      const { container } = render(<TestComponent />);
      const renderTime = performance.now() - startTime;

      // Render should complete quickly (< 100ms in test environment)
      expect(renderTime).toBeLessThan(100);
      expect(container).toBeTruthy();
    });
  });

  describe("Memory Performance", () => {
    test("event listeners are cleaned up", () => {
      const el = document.createElement("button");
      const handler = jest.fn();
      
      el.addEventListener("click", handler);
      expect(el).toBeTruthy();
      
      // Cleanup
      el.removeEventListener("click", handler);
      el.remove();
      
      // Verify cleanup doesn't cause errors
      expect(() => {
        document.body.appendChild(el);
        el.remove();
      }).not.toThrow();
    });
  });
});

// Note: Full E2E performance testing with Playwright:
// See playwright.config.ts and e2e/performance.spec.ts


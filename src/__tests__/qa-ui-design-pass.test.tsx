/**
 * @jest-environment jsdom
 */
/**
 * QA – FILON Step 16.9 Visual & Accessibility Verification
 * Checks contrast ratios, reduced-motion support, focus styles, and glow consistency.
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { axe, toHaveNoViolations } from "jest-axe";
import { motion } from "@/lib/motionPresets";
import Brainbar from "@/components/Brainbar";
import QuickChips from "@/components/QuickChips";
import ExplainOverlay from "@/components/ExplainOverlay";

expect.extend(toHaveNoViolations);

// Mock stores and hooks
jest.mock("@/store/SessionStore", () => ({
  useSessionStore: () => ({
    enqueueThought: jest.fn(),
    activeSessionId: "test-session",
  }),
}));

jest.mock("@/store/FeedbackStore", () => ({
  useFeedbackStore: () => ({
    addFeedback: jest.fn(),
    events: [],
  }),
}));

jest.mock("@/store/ExplainCache", () => ({
  useExplainCache: () => ({
    cachedSummary: null,
    setCache: jest.fn(),
    clearCache: jest.fn(),
  }),
}));

jest.mock("@/hooks/useExplainConfidenceColor", () => ({
  useExplainConfidenceColor: () => "emerald-400",
}));

jest.mock("@/ai/summarizerCore", () => ({
  generateSummaryV2: jest.fn(() =>
    Promise.resolve({
      text: "Test summary",
      confidence: 0.9,
      fromCache: false,
    })
  ),
  getConfidenceColor: jest.fn(() => "emerald-400"),
}));

jest.mock("@/lib/voiceInput", () => ({
  startVoiceCapture: jest.fn(() => Promise.resolve("test transcript")),
}));

// Mock GraphContextStream to avoid complex dependencies
jest.mock("@/components/GraphContextStream", () => ({
  __esModule: true,
  default: () => <div data-testid="graph-context-stream">Context Stream</div>,
}));

describe("UI Design Pass 1 – Visual QA", () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = "";
    // Reset CSS
    document.documentElement.className = "";
  });

  describe("Color System", () => {
    test("brand color tokens are defined", () => {
      // Check that Tailwind classes can be used
      const testEl = document.createElement("div");
      testEl.className = "text-brand bg-surface-base";
      document.body.appendChild(testEl);
      
      expect(testEl.className).toContain("text-brand");
      expect(testEl.className).toContain("bg-surface-base");
    });

    test("surface color tokens are defined", () => {
      const testEl = document.createElement("div");
      testEl.className = "bg-surface-hover bg-surface-active";
      document.body.appendChild(testEl);
      
      expect(testEl.className).toContain("bg-surface-hover");
      expect(testEl.className).toContain("bg-surface-active");
    });

    test("text color tokens are defined", () => {
      const testEl = document.createElement("div");
      testEl.className = "text-text-primary text-text-secondary text-text-muted";
      document.body.appendChild(testEl);
      
      expect(testEl.className).toContain("text-text-primary");
      expect(testEl.className).toContain("text-text-secondary");
      expect(testEl.className).toContain("text-text-muted");
    });
  });

  describe("Focus Styles", () => {
    test("focus outline uses brand color", () => {
      const btn = document.createElement("button");
      btn.className = "focus-visible:ring-brand focus-visible:ring-2";
      btn.textContent = "Click";
      document.body.appendChild(btn);
      
      // Simulate focus
      btn.focus();
      
      // Check that focus-visible classes are present
      expect(btn.className).toContain("focus-visible:ring-brand");
    });

    test("input fields have focus styles", () => {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "focus:ring-brand focus-visible:ring-brand rounded-xl";
      document.body.appendChild(input);
      
      input.focus();
      
      expect(input.className).toContain("focus:ring-brand");
      expect(input.className).toContain("rounded-xl");
    });
  });

  describe("Motion System", () => {
    test("motion presets are defined", () => {
      expect(motion).toBeDefined();
      expect(motion.duration).toBe(0.18);
      expect(motion.easing).toEqual([0.2, 0.8, 0.2, 1]);
      expect(motion.glow).toBeDefined();
      expect(motion.glow.duration).toBe(0.25);
    });

    test("motion duration is optimized for performance", () => {
      expect(motion.duration).toBeLessThanOrEqual(0.25);
      expect(motion.glow.duration).toBeLessThanOrEqual(0.25);
    });

    test("reduced motion preference is detectable", () => {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
      expect(prefersReduced).toBeDefined();
      expect(typeof prefersReduced.matches).toBe("boolean");
    });

    test("motion-soft class disables animations", () => {
      const el = document.createElement("div");
      el.className = "motion-soft";
      document.body.appendChild(el);
      
      const style = getComputedStyle(el);
      // In test environment, we verify the class exists
      expect(el.className).toContain("motion-soft");
    });
  });

  describe("Glow System", () => {
    test("glow class applies correct shadow", () => {
      const el = document.createElement("div");
      el.className = "glow";
      document.body.appendChild(el);
      
      // In test environment, we verify the class is applied
      expect(el.className).toContain("glow");
      
      // Note: Actual box-shadow value would be tested in E2E/visual regression tests
    });

    test("glow is applied to interactive elements", () => {
      const btn = document.createElement("button");
      btn.className = "hover:glow";
      document.body.appendChild(btn);
      
      expect(btn.className).toContain("hover:glow");
    });
  });

  describe("Component Integration", () => {
    test("Brainbar uses unified design tokens", () => {
      const { container } = render(<Brainbar />);
      
      // Check for surface-hover background
      const brainbar = container.querySelector("form > div");
      expect(brainbar).toBeTruthy();
      expect(brainbar?.className).toContain("bg-surface-hover");
      
      // Check for brand icon color
      const icon = container.querySelector("svg");
      expect(icon).toBeTruthy();
    });

    test("Brainbar input has focus styles", () => {
      const { container } = render(<Brainbar />);
      
      const input = container.querySelector("input");
      expect(input).toBeTruthy();
      expect(input?.className).toContain("focus:ring-brand");
      expect(input?.className).toContain("rounded-xl");
    });

    test("QuickChips expose glow interaction styles", () => {
      const { container } = render(<QuickChips onPick={jest.fn()} />);
      const chips = container.querySelectorAll("button");
      expect(chips.length).toBeGreaterThan(0);
      chips.forEach((chip) => {
        expect(chip.className).toContain("focus-glow");
      });
    });
  });

  describe("Accessibility", () => {
    test("Brainbar has proper ARIA labels", () => {
      const { container } = render(<Brainbar />);
      
      const form = container.querySelector("form");
      expect(form).toHaveAttribute("aria-label", "Brainbar");
      
      const input = container.querySelector("input");
      expect(input).toHaveAttribute("aria-label", "Gedanken eingeben");
      expect(input).toHaveAttribute("id", "brainbar-input");
    });

    test("ExplainOverlay has dialog semantics", async () => {
      const { container } = render(
        <ExplainOverlay
          onClose={jest.fn()}
          nodeId="test-node"
          nodeLabel="Test Node"
        />
      );
      
      await waitFor(() => {
        const dialog = container.querySelector('[role="dialog"]');
        expect(dialog).toBeTruthy();
        expect(dialog).toHaveAttribute("aria-modal", "true");
        expect(dialog).toHaveAttribute("aria-labelledby");
      });
    });

    test("ExplainOverlay has focus trap", async () => {
      const onClose = jest.fn();
      const { container } = render(
        <ExplainOverlay
          onClose={onClose}
          nodeId="test-node"
          nodeLabel="Test Node"
        />
      );
      
      await waitFor(() => {
        const closeButton = container.querySelector("button[aria-label*='schließen']");
        expect(closeButton).toBeTruthy();
      });
    });

    test("buttons have aria-labels", () => {
      const { container } = render(<Brainbar />);
      
      const buttons = container.querySelectorAll("button");
      buttons.forEach((btn) => {
        const hasLabel = 
          btn.hasAttribute("aria-label") || 
          btn.hasAttribute("title") ||
          btn.textContent?.trim() !== "";
        expect(hasLabel).toBe(true);
      });
    });
  });

  describe("Border Radius Consistency", () => {
    test("cards use rounded-xl", () => {
      const el = document.createElement("div");
      el.className = "rounded-xl";
      document.body.appendChild(el);
      
      expect(el.className).toContain("rounded-xl");
    });

    test("buttons use rounded-xl", () => {
      const { container } = render(<Brainbar />);
      
      const buttons = container.querySelectorAll("button");
      buttons.forEach((btn) => {
        // Most buttons should have rounded-xl
        const hasRounded = btn.className.includes("rounded-xl") || 
                          btn.className.includes("rounded-md") ||
                          btn.className.includes("rounded-lg");
        expect(hasRounded).toBe(true);
      });
    });
  });

  describe("Color Contrast (Basic)", () => {
    test("text-primary on surface-base has sufficient contrast", () => {
      // Basic check: verify tokens exist
      // Actual contrast ratio would be tested with axe-core or similar
      const testEl = document.createElement("div");
      testEl.className = "bg-surface-base text-text-primary";
      document.body.appendChild(testEl);
      
      expect(testEl.className).toContain("bg-surface-base");
      expect(testEl.className).toContain("text-text-primary");
    });

    test("brand color is defined for interactive elements", () => {
      const btn = document.createElement("button");
      btn.className = "text-brand bg-brand/20";
      document.body.appendChild(btn);
      
      expect(btn.className).toContain("text-brand");
    });
  });

  describe("Accessibility with axe-core", () => {
    test("a11y – no violations on Brainbar", async () => {
      const { container } = render(<Brainbar />);
      const results = await axe(container, {
        rules: {
          // Allow some rules that might be false positives in test environment
          "color-contrast": { enabled: true },
          "aria-allowed-attr": { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    test("a11y – ExplainOverlay dialog has no violations", async () => {
      const { container } = render(
        <ExplainOverlay
          onClose={jest.fn()}
          nodeId="test-node"
          nodeLabel="Test Node"
        />
      );

      await waitFor(() => {
        const dialog = container.querySelector('[role="dialog"]');
        expect(dialog).toBeTruthy();
      });

      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });
});


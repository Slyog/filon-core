/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import PerformanceModeBadge from "@/components/PerformanceModeBadge";
import { runtimeFlags } from "@/config/runtimeFlags";

expect.extend(toHaveNoViolations);

// Mock runtimeFlags
jest.mock("@/config/runtimeFlags", () => ({
  runtimeFlags: {
    motionEnabled: false,
    soundEnabled: false,
  },
}));

describe("Performance Mode Badge Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (runtimeFlags as any).motionEnabled = false;
    (runtimeFlags as any).soundEnabled = false;
  });

  test("Badge is visible when motionEnabled=false", () => {
    render(<PerformanceModeBadge />);
    const badge = screen.getByRole("status");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Performance Mode – Visual + Audio disabled");
  });

  test("Badge is visible when soundEnabled=false", () => {
    (runtimeFlags as any).motionEnabled = true;
    (runtimeFlags as any).soundEnabled = false;

    render(<PerformanceModeBadge />);
    const badge = screen.getByRole("status");
    expect(badge).toBeInTheDocument();
  });

  test("Badge is hidden when both flags are true", () => {
    (runtimeFlags as any).motionEnabled = true;
    (runtimeFlags as any).soundEnabled = true;

    const { container } = render(<PerformanceModeBadge />);
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  test("Badge has correct accessibility attributes", () => {
    render(<PerformanceModeBadge />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveAttribute("aria-live", "polite");
  });

  test("Badge has correct styling", () => {
    render(<PerformanceModeBadge />);
    const badge = screen.getByRole("status");
    const styles = window.getComputedStyle(badge);

    expect(badge).toHaveStyle({
      position: "fixed",
      bottom: "12px",
      right: "12px",
      opacity: "0.7",
    });
  });

  test("Badge passes axe accessibility scan", async () => {
    const { container } = render(<PerformanceModeBadge />);
    const results = await axe(container);
    const serious = results.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical"
    );
    expect(serious).toHaveLength(0);
  });

  test("Badge is not accessible by screen reader when hidden", () => {
    (runtimeFlags as any).motionEnabled = true;
    (runtimeFlags as any).soundEnabled = true;

    const { container } = render(<PerformanceModeBadge />);
    const statusElements = container.querySelectorAll('[role="status"]');
    expect(statusElements.length).toBe(0);
  });
});


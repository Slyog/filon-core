/**
 * @jest-environment jsdom
 */

import React from "react";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import Home from "@/app/page";

expect.extend(toHaveNoViolations);

jest.mock("reactflow", () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="reactflow-provider">{children}</div>
  ),
  ReactFlow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="reactflow-canvas">{children}</div>
  ),
  Background: () => null,
}));

jest.mock("@/components/shell/AppShell", () => {
  const React = require("react");
  const SidebarNav = require("@/components/shell/Sidebar").default;
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="app-shell-mock">
        <SidebarNav />
        {children}
      </div>
    ),
  };
});

jest.mock("@/store/SessionStore", () => ({
  useSessionStore: (selector = (state: any) => state) =>
    selector({
      sessions: [],
      activeSessionId: null,
      setActiveSession: jest.fn(),
      addSession: jest.fn(async () => "session-id"),
      updateSessionTitle: jest.fn(),
      deleteSession: jest.fn(),
      createOrGetActive: jest.fn(async () => "session-id"),
      enqueueThought: jest.fn(),
      generateTitleFromThought: jest.fn(() => "Generated title"),
    }),
}));

jest.mock("localforage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("Accessibility labels & placeholders", () => {
  test("critical aria-labels and placeholders exist and pass axe", async () => {
    window.alert = jest.fn();
    window.prompt = jest.fn();
    window.confirm = jest.fn();

    const { container, getByPlaceholderText } = render(<Home />);

    expect(getByPlaceholderText(/Write a thought/)).toBeTruthy();
    expect(container.querySelector('[aria-label="Add Goal"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Go to Archive"]')).not.toBeNull();

    const results = await axe(container);
    const severe = results.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical"
    );
    expect(severe).toHaveLength(0);
  });
});


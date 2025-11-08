/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
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

jest.mock("@/components/shell/AppShell", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell-mock">{children}</div>
  ),
}));

jest.mock("@/store/SessionStore", () => ({
  useSessionStore: (selector = (state: any) => state) =>
    selector({ setActiveSession: jest.fn() }),
}));

jest.mock("localforage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

describe("Global a11y audit", () => {
  test("main view passes axe without serious issues", async () => {
    const { container } = render(<Home />);

    const brainbar = await screen.findByRole("search", { name: /Brainbar/i });
    expect(brainbar).toBeInTheDocument();
    const miniGraph = await screen.findByRole("img", { name: /Mini-Graph/i });
    expect(miniGraph).toBeInTheDocument();

    const results = await axe(container);
    const serious = results.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical"
    );
    expect(serious).toHaveLength(0);
  });
});


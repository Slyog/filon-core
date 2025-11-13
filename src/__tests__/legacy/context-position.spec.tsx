/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import MiniGraph from "@/components/MiniGraph";
import GraphContextStream from "@/components/GraphContextStream";
import { uiConfig, setContextPosition } from "@/config/uiConfig";

jest.mock("reactflow", () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="reactflow-provider">{children}</div>
  ),
  ReactFlow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="reactflow-canvas">{children}</div>
  ),
  Background: () => null,
}));

const mockEvents = [
  {
    id: "evt-1",
    type: "user_action",
    payload: { message: "Mock" },
    timestamp: Date.now(),
    nodeId: null,
  },
];

jest.mock("@/store/FeedbackStore", () => ({
  useFeedbackStore: (selector = (state: any) => state) =>
    selector({
      events: mockEvents,
      addFeedback: jest.fn(),
    }),
}));

jest.mock("@/context/ActiveNodeContext", () => ({
  useActiveNode: () => ({ activeNodeId: null }),
}));

jest.mock("@/components/ExplainOverlay", () => () => (
  <div data-testid="explain-overlay" />
));

jest.mock("@/components/Panel", () => ({
  Panel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="panel">{children}</div>
  ),
}));

jest.mock("localforage", () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

const nodes = [
  { id: "node-1", label: "Node 1" },
  { id: "node-2", label: "Node 2" },
];

const edges = [{ id: "edge-1", source: "node-1", target: "node-2" }];

const TestLayout = () => (
  <div data-testid="context-layout">
    <MiniGraph nodes={nodes} edges={edges} />
    <GraphContextStream nodes={[]} position={uiConfig.contextPosition} />
  </div>
);

describe("Context Stream positioning", () => {
  beforeEach(() => {
    setContextPosition("bottom");
  });

  test("bottom position clamps height and sticks header", () => {
    const { rerender } = render(<TestLayout />);
    const layout = screen.getByTestId("context-layout");
    const sections = Array.from(
      layout.querySelectorAll("[data-testid='mini-graph'], [data-testid='graph-context-stream']")
    );
    expect(sections[0]).toHaveAttribute("data-testid", "mini-graph");
    expect(sections[1]).toHaveAttribute("data-testid", "graph-context-stream");

    const panel = screen.getByTestId("graph-context-stream");
    expect(panel.style.height).toContain("clamp(35vh");
    expect(panel.style.maxHeight).toContain("clamp");

    const header = screen.getByTestId("graph-context-stream-header");
    expect(header.className).toContain("sticky");
    expect(header.className).toContain("top-0");

    // Switch to side layout to ensure rerender works
    setContextPosition("side");
    rerender(<TestLayout />);
    const sidePanel = screen.getByTestId("graph-context-stream");
    expect(sidePanel.getAttribute("data-position")).toBe("side");
  });

  test("side position exposes complementary role and fixed width", () => {
    setContextPosition("side");
    render(<TestLayout />);
    const panel = screen.getByRole("complementary", {
      name: /Context Stream Panel/i,
    });
    expect(panel).toHaveAttribute("data-position", "side");
    expect(panel.className).toContain("w-[360px]");
  });
});


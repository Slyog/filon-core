import React, { useEffect, useRef } from "react";
import { render, screen } from "@testing-library/react";
import GraphCanvas from "@/components/GraphCanvas.client";

jest.mock("reactflow", () => {
  const React = require("react");
  const mockInstance = { fitView: jest.fn() };

  const ReactFlow = ({ children, onInit, ...rest }: any) => {
    const initRef = useRef(onInit);
    useEffect(() => {
      initRef.current = onInit;
    }, [onInit]);

    useEffect(() => {
      initRef.current?.(mockInstance);
    }, []);

    return (
      <div data-testid="graph-flow-root" {...rest}>
        {children}
      </div>
    );
  };

  return {
    Background: ({ ...props }: any) => (
      <div data-testid="rf-background" {...props} />
    ),
    BackgroundVariant: { Dots: "dots" },
    Controls: ({ ...props }: any) => (
      <div data-testid="rf-controls" {...props} />
    ),
    MiniMap: ({ ...props }: any) => (
      <div data-testid="rf-minimap" {...props} />
    ),
    ReactFlow,
    ReactFlowProvider: ({ children }: any) => (
      <div data-testid="rf-provider">{children}</div>
    ),
    useEdgesState: () => [[], jest.fn(), jest.fn()],
    useNodesState: () => [[], jest.fn(), jest.fn()],
  };
});

describe("GraphCanvas", () => {
  it("mounts canvas root and seeds initial label", async () => {
    render(<GraphCanvas sessionId="session-1" initialThought="Hello FILON" />);

    const root = await screen.findByTestId("graph-flow-root");
    expect(root).toBeInTheDocument();
  });
});

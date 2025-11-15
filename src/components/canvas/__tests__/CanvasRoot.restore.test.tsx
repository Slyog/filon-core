/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CanvasRoot } from "../CanvasRoot";
import { useFlowStore } from "../useFlowStore";
import { saveCanvasSession, clearCanvasSession, hasCanvasSession, hasDirtySession, markSessionClean } from "@/lib/session";
import { logTelemetry } from "@/utils/telemetryLogger";
import type { CanvasRestoreHandle } from "@/components/layout/AppFrame";

// Mock telemetry logger
jest.mock("@/utils/telemetryLogger", () => ({
  logTelemetry: jest.fn(() => Promise.resolve()),
}));

// Mock ReactFlow components
jest.mock("reactflow", () => {
  const actual = jest.requireActual("reactflow");
  return {
    ...actual,
    ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ReactFlow: ({ children }: { children: React.ReactNode }) => <div data-testid="reactflow">{children}</div>,
    Background: () => null,
    Controls: () => null,
    MiniMap: () => null,
  };
});

// Mock FlowCanvas to avoid ReactFlow complexity
jest.mock("../FlowCanvas", () => ({
  FlowCanvas: () => <div data-testid="flow-canvas">FlowCanvas</div>,
}));

describe("CanvasRoot Restore Functionality", () => {
  let mockRestoreHandle: CanvasRestoreHandle;

  beforeEach(() => {
    jest.clearAllMocks();
    clearCanvasSession();
    (logTelemetry as jest.Mock).mockClear();

    // Setup mock restore handle
    mockRestoreHandle = {
      hasSavedState: jest.fn(() => hasCanvasSession()),
      restore: jest.fn(() => {
        const sessionState = require("@/lib/session").loadCanvasSession();
        if (sessionState) {
          useFlowStore.getState().loadSnapshot({
            version: 1,
            createdAt: sessionState.savedAt,
            workspaceId: null,
            nodes: sessionState.nodes,
            edges: sessionState.edges,
            presetId: sessionState.presetId ?? null,
          });
          clearCanvasSession();
          return true;
        }
        return false;
      }),
    };

    (window as any).__canvasRestore = mockRestoreHandle;
  });

  afterEach(() => {
    clearCanvasSession();
    delete (window as any).__canvasRestore;
    // Reset flow store to initial state
    useFlowStore.setState({
      nodes: [
        { id: "1", type: "default", position: { x: 0, y: -150 }, data: { label: "Welcome to FILON" } },
        { id: "2", type: "goal", position: { x: 0, y: 0 }, data: { label: "Create Your First Goal" } },
        { id: "3", type: "track", position: { x: 0, y: 150 }, data: { label: "Add a Track" } },
      ],
      edges: [],
      presetId: null,
    });
  });

  it("should show RestoreToast when dirty session exists", async () => {
    // Save a session (which will be marked as dirty by default)
    const testNodes = [
      { id: "test-1", type: "default", position: { x: 100, y: 100 }, data: { label: "Test Node" } },
    ];
    saveCanvasSession({
      nodes: testNodes,
      edges: [],
      presetId: null,
    });

    expect(hasDirtySession()).toBe(true);

    render(<CanvasRoot />);

    // Toast should appear
    await waitFor(() => {
      const toast = screen.getByTestId("restore-toast");
      expect(toast).toBeInTheDocument();
      expect(screen.getByText("Unsaved session detected")).toBeInTheDocument();
      expect(screen.getByText(/A previously saved canvas was found. Restore it\?/)).toBeInTheDocument();
    });

    // Verify logging was called
    await waitFor(() => {
      expect(logTelemetry).toHaveBeenCalledWith(
        "session:restore:shown",
        "Restore toast displayed",
        {},
        undefined
      );
    });
  });

  it("should NOT show RestoreToast when no session exists", () => {
    expect(hasCanvasSession()).toBe(false);

    render(<CanvasRoot />);

    // Toast should not appear
    expect(screen.queryByTestId("restore-toast")).not.toBeInTheDocument();
  });

  it("should load snapshot when clicking Restore button", async () => {
    // Save a session with test nodes
    const testNodes = [
      { id: "restore-test-1", type: "default", position: { x: 200, y: 200 }, data: { label: "Restored Node" } },
    ];
    saveCanvasSession({
      nodes: testNodes,
      edges: [],
      presetId: null,
    });

    render(<CanvasRoot />);

    // Wait for toast to appear
    await waitFor(() => {
      expect(screen.getByTestId("restore-toast")).toBeInTheDocument();
    });

    // Click Restore button
    const restoreButton = screen.getByRole("button", { name: /restore/i });
    expect(restoreButton).toBeInTheDocument();

    act(() => {
      restoreButton.click();
    });

    // Should call restore handle
    expect(mockRestoreHandle.restore).toHaveBeenCalled();

    // Wait for toast to disappear
    await waitFor(() => {
      expect(screen.queryByTestId("restore-toast")).not.toBeInTheDocument();
    });

    // Verify nodes were loaded
    const state = useFlowStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].id).toBe("restore-test-1");
    expect(state.nodes[0].data.label).toBe("Restored Node");

    // Verify logging was called
    expect(logTelemetry).toHaveBeenCalledWith(
      "session:restore:requested",
      "User requested session restore",
      {},
      undefined
    );
    expect(logTelemetry).toHaveBeenCalledWith(
      "session:restore:success",
      "Session restore succeeded",
      {},
      undefined
    );
  });

  it("should clear sessionStorage when clicking Discard button", async () => {
    // Save a session
    const testNodes = [
      { id: "discard-test-1", type: "default", position: { x: 300, y: 300 }, data: { label: "Discarded Node" } },
    ];
    saveCanvasSession({
      nodes: testNodes,
      edges: [],
      presetId: null,
    });

    expect(hasCanvasSession()).toBe(true);

    render(<CanvasRoot />);

    // Wait for toast to appear
    await waitFor(() => {
      expect(screen.getByTestId("restore-toast")).toBeInTheDocument();
    });

    // Click Discard button
    const discardButton = screen.getByRole("button", { name: /discard/i });
    expect(discardButton).toBeInTheDocument();

    act(() => {
      discardButton.click();
    });

    // Should clear session
    expect(hasCanvasSession()).toBe(false);

    // Toast should disappear
    await waitFor(() => {
      expect(screen.queryByTestId("restore-toast")).not.toBeInTheDocument();
    });

    // Verify logging was called
    expect(logTelemetry).toHaveBeenCalledWith(
      "session:restore:discard",
      "User discarded session restore",
      {},
      undefined
    );
  });

  it("should hide toast after Restore", async () => {
    const testNodes = [
      { id: "hide-test-1", type: "default", position: { x: 400, y: 400 }, data: { label: "Hide Test" } },
    ];
    saveCanvasSession({
      nodes: testNodes,
      edges: [],
      presetId: null,
    });

    render(<CanvasRoot />);

    await waitFor(() => {
      expect(screen.getByTestId("restore-toast")).toBeInTheDocument();
    });

    const restoreButton = screen.getByRole("button", { name: /restore/i });

    act(() => {
      restoreButton.click();
    });

    await waitFor(() => {
      expect(screen.queryByTestId("restore-toast")).not.toBeInTheDocument();
    });
  });

  it("should hide toast after Discard", async () => {
    const testNodes = [
      { id: "hide-discard-test-1", type: "default", position: { x: 500, y: 500 }, data: { label: "Hide Discard Test" } },
    ];
    saveCanvasSession({
      nodes: testNodes,
      edges: [],
      presetId: null,
    });

    render(<CanvasRoot />);

    await waitFor(() => {
      expect(screen.getByTestId("restore-toast")).toBeInTheDocument();
    });

    const discardButton = screen.getByRole("button", { name: /discard/i });

    act(() => {
      discardButton.click();
    });

    await waitFor(() => {
      expect(screen.queryByTestId("restore-toast")).not.toBeInTheDocument();
    });
  });

  it("should NOT trigger restore automatically", async () => {
    // Save a session
    const testNodes = [
      { id: "auto-test-1", type: "default", position: { x: 600, y: 600 }, data: { label: "Auto Test" } },
    ];
    saveCanvasSession({
      nodes: testNodes,
      edges: [],
      presetId: null,
    });

    render(<CanvasRoot />);

    // Wait a bit to ensure restore doesn't trigger automatically
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Restore should NOT have been called automatically
    expect(mockRestoreHandle.restore).not.toHaveBeenCalled();

    // Toast should be visible (waiting for user action)
    expect(screen.getByTestId("restore-toast")).toBeInTheDocument();
  });
});


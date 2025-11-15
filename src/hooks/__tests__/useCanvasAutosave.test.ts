/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { useCanvasAutosave } from "../useCanvasAutosave";
import { clearCanvasSession } from "@/lib/session";
import type { Node, Edge } from "reactflow";

// Mock session module
jest.mock("@/lib/session", () => {
  const original = jest.requireActual("@/lib/session");
  return {
    ...original,
    saveCanvasSession: jest.fn(),
    clearCanvasSession: jest.fn(original.clearCanvasSession),
  };
});

const { saveCanvasSession } = require("@/lib/session");

describe("useCanvasAutosave", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    clearCanvasSession();
    (saveCanvasSession as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    clearCanvasSession();
  });

  it("should trigger autosave after changes (throttled)", async () => {
    const initialNodes: Node[] = [{ id: "1", type: "default", position: { x: 0, y: 0 }, data: {} }];
    const initialEdges: Edge[] = [];

    const { result, rerender } = renderHook(
      ({ data }) => useCanvasAutosave(data, 100),
      {
        initialProps: {
          data: { nodes: initialNodes, edges: initialEdges },
        },
      }
    );

    // Initial render will trigger autosave (first time is a "change")
    // Wait for initial autosave to complete
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(saveCanvasSession).toHaveBeenCalledTimes(1);
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    // Clear mocks for the actual test
    (saveCanvasSession as jest.Mock).mockClear();

    // Change nodes
    const updatedNodes: Node[] = [
      { id: "1", type: "default", position: { x: 10, y: 10 }, data: {} },
    ];

    act(() => {
      rerender({ data: { nodes: updatedNodes, edges: initialEdges } });
    });

    // Should immediately mark as unsaved
    expect(result.current.hasUnsavedChanges).toBe(true);

    // Should not save immediately (throttled)
    expect(saveCanvasSession).not.toHaveBeenCalled();

    // Advance timer past throttle delay
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should save after throttle
    expect(saveCanvasSession).toHaveBeenCalledTimes(1);
    expect(saveCanvasSession).toHaveBeenCalledWith({
      nodes: updatedNodes,
      edges: initialEdges,
      presetId: undefined,
      metadata: undefined,
    });

    // Should mark as saved after save completes
    await waitFor(() => {
      expect(result.current.hasUnsavedChanges).toBe(false);
    });
  });

  it("should NOT trigger autosave when data is unchanged", async () => {
    const nodes: Node[] = [{ id: "1", type: "default", position: { x: 0, y: 0 }, data: {} }];
    const edges: Edge[] = [];

    const { rerender, result } = renderHook(
      ({ data }) => useCanvasAutosave(data, 100),
      {
        initialProps: {
          data: { nodes, edges },
        },
      }
    );

    // Wait for initial autosave to complete
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    // Clear initial save
    (saveCanvasSession as jest.Mock).mockClear();

    // Re-render with same data
    act(() => {
      rerender({ data: { nodes, edges } });
    });

    // Advance time
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Should not save (no changes)
    expect(saveCanvasSession).not.toHaveBeenCalled();
  });

  it("should set hasUnsavedChanges = true immediately before save", () => {
    const initialNodes: Node[] = [{ id: "1", type: "default", position: { x: 0, y: 0 }, data: {} }];
    const updatedNodes: Node[] = [
      { id: "1", type: "default", position: { x: 10, y: 10 }, data: {} },
    ];

    const { result, rerender } = renderHook(
      ({ data }) => useCanvasAutosave(data, 100),
      {
        initialProps: {
          data: { nodes: initialNodes, edges: [] },
        },
      }
    );

    // Change data
    act(() => {
      rerender({ data: { nodes: updatedNodes, edges: [] } });
    });

    // Should be unsaved immediately (before throttle completes)
    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(saveCanvasSession).not.toHaveBeenCalled();
  });

  it("should set hasUnsavedChanges = false after save completes", async () => {
    const initialNodes: Node[] = [{ id: "1", type: "default", position: { x: 0, y: 0 }, data: {} }];
    const updatedNodes: Node[] = [
      { id: "1", type: "default", position: { x: 10, y: 10 }, data: {} },
    ];

    const { result, rerender } = renderHook(
      ({ data }) => useCanvasAutosave(data, 100),
      {
        initialProps: {
          data: { nodes: initialNodes, edges: [] },
        },
      }
    );

    // Change data
    act(() => {
      rerender({ data: { nodes: updatedNodes, edges: [] } });
    });

    expect(result.current.hasUnsavedChanges).toBe(true);

    // Advance timer to trigger save
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should save and mark as saved
    expect(saveCanvasSession).toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current.hasUnsavedChanges).toBe(false);
    });
  });

  it("should stop the timer on unmount", () => {
    const nodes: Node[] = [{ id: "1", type: "default", position: { x: 0, y: 0 }, data: {} }];
    const updatedNodes: Node[] = [
      { id: "1", type: "default", position: { x: 10, y: 10 }, data: {} },
    ];

    const { result, rerender, unmount } = renderHook(
      ({ data }) => useCanvasAutosave(data, 100),
      {
        initialProps: {
          data: { nodes, edges: [] },
        },
      }
    );

    // Change data (starts timer)
    act(() => {
      rerender({ data: { nodes: updatedNodes, edges: [] } });
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
    expect(saveCanvasSession).not.toHaveBeenCalled();

    // Unmount before timer completes
    act(() => {
      unmount();
    });

    // Advance timer
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Should not save after unmount
    expect(saveCanvasSession).not.toHaveBeenCalled();
  });

  it("should handle edge changes", () => {
    const nodes: Node[] = [
      { id: "1", type: "default", position: { x: 0, y: 0 }, data: {} },
      { id: "2", type: "default", position: { x: 100, y: 0 }, data: {} },
    ];
    const initialEdges: Edge[] = [];
    const updatedEdges: Edge[] = [
      { id: "e1", source: "1", target: "2", type: "default" },
    ];

    const { result, rerender } = renderHook(
      ({ data }) => useCanvasAutosave(data, 100),
      {
        initialProps: {
          data: { nodes, edges: initialEdges },
        },
      }
    );

    // Add edge
    act(() => {
      rerender({ data: { nodes, edges: updatedEdges } });
    });

    expect(result.current.hasUnsavedChanges).toBe(true);

    // Advance timer
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(saveCanvasSession).toHaveBeenCalledWith({
      nodes,
      edges: updatedEdges,
      presetId: undefined,
      metadata: undefined,
    });
  });

  it("should handle presetId changes", () => {
    const nodes: Node[] = [{ id: "1", type: "default", position: { x: 0, y: 0 }, data: {} }];

    const { result, rerender } = renderHook(
      ({ data }) => useCanvasAutosave(data, 100),
      {
        initialProps: {
          data: { nodes, edges: [], presetId: null },
        },
      }
    );

    // Change presetId
    act(() => {
      rerender({ data: { nodes, edges: [], presetId: "career" } });
    });

    expect(result.current.hasUnsavedChanges).toBe(true);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(saveCanvasSession).toHaveBeenCalledWith({
      nodes,
      edges: [],
      presetId: "career",
      metadata: undefined,
    });
  });
});


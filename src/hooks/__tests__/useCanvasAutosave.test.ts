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
      // Initial save: first call with dirty: true, second with dirty: false
      expect(saveCanvasSession).toHaveBeenCalledTimes(2);
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

    // Should immediately mark session as dirty when changes are detected
    expect(saveCanvasSession).toHaveBeenCalledTimes(1);
    expect(saveCanvasSession).toHaveBeenCalledWith(
      {
        nodes: updatedNodes,
        edges: initialEdges,
        presetId: undefined,
        metadata: undefined,
      },
      true // dirty: true - marked as dirty immediately
    );

    // Advance timer past throttle delay
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should save again after throttle with dirty: false
    expect(saveCanvasSession).toHaveBeenCalledTimes(2);
    expect(saveCanvasSession).toHaveBeenLastCalledWith(
      {
        nodes: updatedNodes,
        edges: initialEdges,
        presetId: undefined,
        metadata: undefined,
      },
      false // dirty: false for autosave completion
    );

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

    // Wait for initial save to complete
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Clear initial save calls
    (saveCanvasSession as jest.Mock).mockClear();

    // Change data
    act(() => {
      rerender({ data: { nodes: updatedNodes, edges: [] } });
    });

    // Should be unsaved immediately (before throttle completes)
    expect(result.current.hasUnsavedChanges).toBe(true);
    
    // Should immediately mark as dirty when changes are detected
    expect(saveCanvasSession).toHaveBeenCalledTimes(1);
    expect(saveCanvasSession).toHaveBeenCalledWith(
      {
        nodes: updatedNodes,
        edges: [],
        presetId: undefined,
        metadata: undefined,
      },
      true // dirty: true - marked as dirty immediately
    );
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

    // Wait for initial save to complete
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Clear initial save calls
    (saveCanvasSession as jest.Mock).mockClear();

    // Change data (starts timer)
    act(() => {
      rerender({ data: { nodes: updatedNodes, edges: [] } });
    });

    expect(result.current.hasUnsavedChanges).toBe(true);
    
    // Should immediately mark as dirty when changes are detected
    expect(saveCanvasSession).toHaveBeenCalledTimes(1);
    expect(saveCanvasSession).toHaveBeenCalledWith(
      {
        nodes: updatedNodes,
        edges: [],
        presetId: undefined,
        metadata: undefined,
      },
      true // dirty: true - marked as dirty immediately
    );

    // Unmount before timer completes
    act(() => {
      unmount();
    });

    // Advance timer
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Should not save again after unmount (only the immediate dirty mark happened)
    expect(saveCanvasSession).toHaveBeenCalledTimes(1);
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

    // Should immediately mark as dirty
    expect(saveCanvasSession).toHaveBeenCalledWith(
      {
        nodes,
        edges: updatedEdges,
        presetId: undefined,
        metadata: undefined,
      },
      true // dirty: true - marked as dirty immediately
    );

    // Advance timer
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should save again after throttle with dirty: false
    expect(saveCanvasSession).toHaveBeenLastCalledWith(
      {
        nodes,
        edges: updatedEdges,
        presetId: undefined,
        metadata: undefined,
      },
      false // dirty: false for autosave completion
    );
  });

  it("should handle presetId changes", () => {
    const nodes: Node[] = [{ id: "1", type: "default", position: { x: 0, y: 0 }, data: {} }];

    const { result, rerender } = renderHook(
      ({ data }) => useCanvasAutosave(data, 100),
      {
        initialProps: {
          data: { nodes, edges: [], presetId: null as string | null },
        },
      }
    );

    // Wait for initial save to complete
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Clear initial save calls
    (saveCanvasSession as jest.Mock).mockClear();

    // Change presetId
    act(() => {
      rerender({ data: { nodes, edges: [], presetId: "career" as string | null } });
    });

    expect(result.current.hasUnsavedChanges).toBe(true);

    // Should immediately mark as dirty when changes are detected
    expect(saveCanvasSession).toHaveBeenCalledTimes(1);
    expect(saveCanvasSession).toHaveBeenCalledWith(
      {
        nodes,
        edges: [],
        presetId: "career",
        metadata: undefined,
      },
      true // dirty: true - marked as dirty immediately
    );

    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should save again after throttle with dirty: false
    expect(saveCanvasSession).toHaveBeenCalledTimes(2);
    expect(saveCanvasSession).toHaveBeenLastCalledWith(
      {
        nodes,
        edges: [],
        presetId: "career",
        metadata: undefined,
      },
      false // dirty: false for autosave completion
    );
  });
});


/**
 * @jest-environment jsdom
 */

import React, { useMemo, useRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import Brainbar, { type BrainbarHandle } from "@/components/Brainbar";
import QuickChips from "@/components/QuickChips";
import ContextStream from "@/components/ContextStream";
import MiniGraph from "@/components/MiniGraph";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

jest.mock("reactflow", () => ({
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="reactflow-provider">{children}</div>
  ),
  ReactFlow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="reactflow-canvas">{children}</div>
  ),
  Background: () => null,
}));

const focusableSelector =
  'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const getFocusable = () =>
  Array.from(document.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (el) => !el.hasAttribute("disabled")
  );

const pressTab = (shiftKey = false) => {
  const focusables = getFocusable();
  if (focusables.length === 0) return;

  const active = document.activeElement as HTMLElement | null;
  let currentIndex = active ? focusables.indexOf(active) : -1;

  if (shiftKey) {
    currentIndex =
      currentIndex <= 0
        ? focusables.length - 1
        : (currentIndex - 1) % focusables.length;
  } else {
    currentIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % focusables.length;
  }

  focusables[currentIndex]?.focus();
};

const streamItems = [
  {
    id: "alpha",
    title: "Alpha insight",
    summary: "First entry in context stream.",
    confidence: 91,
    ts: Date.now(),
  },
  {
    id: "beta",
    title: "Beta insight",
    summary: "Second entry in context stream.",
    confidence: 88,
    ts: Date.now(),
  },
];

const miniNodes = [
  { id: "n-1", label: "Node 1" },
  { id: "n-2", label: "Node 2" },
];

const miniEdges = [{ id: "e-1", source: "n-1", target: "n-2" }];

const TabHarness = () => {
  const brainbarRef = useRef<BrainbarHandle>(null);
  const shortcuts = useMemo(
    () => [
      {
        key: "n",
        ctrl: true,
        handler: () => brainbarRef.current?.focus(),
        allowInInputs: true,
      },
    ],
    []
  );

  useKeyboardShortcuts(shortcuts);

  return (
    <div>
      <Brainbar ref={brainbarRef} onSubmit={() => {}} />
      <QuickChips onPick={() => {}} />
      <ContextStream items={streamItems} onSelect={() => {}} />
      <MiniGraph nodes={miniNodes} edges={miniEdges} />
    </div>
  );
};

describe("Keyboard navigation flow", () => {
  test("Tab order matches Brainbar → QuickChip → Context Stream → MiniGraph", async () => {
    render(<TabHarness />);

    const brainbarInput = await screen.findByLabelText("Enter thought");
    const firstChip = await screen.findByTestId("quickchip-/goal");
    await waitFor(() =>
      expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(2)
    );
    const contextItems = screen.getAllByRole("listitem");
    const miniGraph = await screen.findByTestId("mini-graph");

    pressTab();
    expect(document.activeElement).toBe(brainbarInput);

    pressTab();
    expect(document.activeElement).toBe(firstChip);

    pressTab();
    pressTab();
    pressTab();

    pressTab();
    expect(document.activeElement).toBe(contextItems[0]);

    pressTab();
    expect(document.activeElement).toBe(contextItems[1]);

    pressTab();
    expect(document.activeElement).toBe(miniGraph);

    pressTab(true);
    expect(document.activeElement).toBe(contextItems[1]);

    pressTab(true);
    expect(document.activeElement).toBe(contextItems[0]);
  });

  test("Ctrl+N focuses the Brainbar input", async () => {
    render(<TabHarness />);

    const brainbarInput = await screen.findByLabelText("Enter thought");
    const miniGraph = await screen.findByTestId("mini-graph");
    miniGraph.focus();

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "n", ctrlKey: true })
      );
    });

    expect(document.activeElement).toBe(brainbarInput);
  });
});

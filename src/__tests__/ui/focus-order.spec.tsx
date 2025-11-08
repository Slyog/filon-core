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

const getFocusableElements = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>(focusableSelector)
  ).filter((el) => !el.hasAttribute("disabled"));

const simulateTab = (shiftKey = false) => {
  const focusables = getFocusableElements();
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
      currentIndex === -1
        ? 0
        : (currentIndex + 1) % focusables.length;
  }

  focusables[currentIndex]?.focus();
};

const items = [
  {
    id: "a",
    title: "Alpha",
    summary: "Erster Eintrag",
    confidence: 91,
    ts: Date.now(),
  },
  {
    id: "b",
    title: "Beta",
    summary: "Zweiter Eintrag",
    confidence: 88,
    ts: Date.now(),
  },
  {
    id: "c",
    title: "Gamma",
    summary: "Dritter Eintrag",
    confidence: 82,
    ts: Date.now(),
  },
];

const nodes = [
  { id: "n-1", label: "Node 1" },
  { id: "n-2", label: "Node 2" },
];

const edges = [{ id: "e-1", source: "n-1", target: "n-2" }];

const FocusHarness = () => {
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
      <ContextStream
        items={items}
        onSelect={() => {}}
      />
      <MiniGraph nodes={nodes} edges={edges} />
    </div>
  );
};

describe("Focus order and shortcuts", () => {
  test("Tab order respects Brainbar > Chips > Stream > MiniGraph", async () => {
    render(<FocusHarness />);

    const brainbarInput = await screen.findByLabelText("Gedanken eingeben");
    const firstChip = await screen.findByTestId("quickchip-/goal");
    await waitFor(() =>
      expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(2)
    );
    const streamItems = screen.getAllByRole("listitem");
    const miniGraph = await screen.findByTestId("mini-graph");

    simulateTab(); // Brainbar
    expect(document.activeElement).toBe(brainbarInput);

    simulateTab(); // First chip
    expect(document.activeElement).toBe(firstChip);

    simulateTab(); // First stream item
    expect(document.activeElement).toBe(streamItems[0]);

    simulateTab(); // Second stream item
    expect(document.activeElement).toBe(streamItems[1]);

    simulateTab(); // MiniGraph wrapper
    expect(document.activeElement).toBe(miniGraph);

    simulateTab(true); // back to second stream item
    expect(document.activeElement).toBe(streamItems[1]);

    simulateTab(true); // back to first stream item
    expect(document.activeElement).toBe(streamItems[0]);
  });

  test("Ctrl+N focuses Brainbar via shortcut", async () => {
    render(<FocusHarness />);
    const brainbarInput = await screen.findByLabelText("Gedanken eingeben");
    const miniGraph = await screen.findByTestId("mini-graph");
    miniGraph.focus();
    expect(document.activeElement).toBe(miniGraph);

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "n", ctrlKey: true })
      );
    });

    expect(document.activeElement).toBe(brainbarInput);
  });
});

